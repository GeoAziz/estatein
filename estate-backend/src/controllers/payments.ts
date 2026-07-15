// Payment processing controller for M-Pesa and other payment methods

import { Request, Response } from 'express';
import prisma from '../config/database.js';
import MpesaService, { MpesaInitiateResponse } from '../services/mpesa.js';
import { convertCurrency, Currency } from '../services/currency.js';
import { createSmsProvider, SMS_TEMPLATES } from '../services/sms.js';
import { fcmService, FCM_TEMPLATES } from '../services/fcm.js';

// Secret path segment M-Pesa must echo back on every callback request, so a
// caller who doesn't know it can't fabricate payment-completion callbacks.
const MPESA_CALLBACK_TOKEN = process.env.MPESA_CALLBACK_TOKEN || '';

// Initialize M-Pesa service from environment variables
const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  businessShortCode: process.env.MPESA_SHORT_CODE || '174379',
  passkey: process.env.MPESA_PASSKEY || '',
  callbackUrl: `${(process.env.MPESA_CALLBACK_URL || 'https://api.estatein.local/api/payments/mpesa/callback').replace(/\/$/, '')}/${MPESA_CALLBACK_TOKEN}`,
  environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
};

const mpesaService = new MpesaService(mpesaConfig);

// Initialize SMS provider from environment variables
const smsProvider = createSmsProvider({
  provider: (process.env.SMS_PROVIDER || 'africastalking') as any,
  apiKey: process.env.SMS_API_KEY || '',
  apiSecret: process.env.SMS_API_SECRET,
  senderId: process.env.SMS_SENDER_ID || 'ESTATEIN',
});

export async function initiatePayment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, method, phoneNumber, listingId, accountReference, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!phoneNumber && method === 'mpesa') {
      return res.status(400).json({ error: 'Phone number required for M-Pesa' });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: Currency.KSH,
        method,
        phoneNumber,
        description: description || `Payment from EstateIn`,
        status: 'pending',
      },
    });

    if (method === 'mpesa') {
      try {
        // Initiate M-Pesa STK push
        const mpesaResponse = await mpesaService.initiatePayment(
          phoneNumber,
          amount,
          accountReference || payment.id,
          description || 'EstateIn Payment'
        );

        // Update payment with M-Pesa details
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            transactionId: mpesaResponse.CheckoutRequestID,
            metadata: mpesaResponse as any,
          },
        });

        // Send SMS notification
        try {
          const smsMessage = `EstateIn: Enter your M-Pesa PIN to pay KSh ${amount}. ${mpesaResponse.CustomerMessage}`;
          await smsProvider.send(phoneNumber, smsMessage);
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
          // Don't fail the payment if SMS fails
        }

        return res.json({
          success: true,
          paymentId: payment.id,
          transactionId: mpesaResponse.CheckoutRequestID,
          status: 'initiated',
          message: mpesaResponse.CustomerMessage,
        });
      } catch (mpesaError) {
        // Update payment status to failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            failureReason: String(mpesaError),
          },
        });

        console.error('M-Pesa initiation error:', mpesaError);
        return res.status(400).json({
          error: 'Failed to initiate M-Pesa payment',
        });
      }
    }

    return res.json({
      success: true,
      paymentId: payment.id,
      status: 'initiated',
      method,
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      error: 'Failed to process payment',
    });
  }
}

export async function mpesaCallback(req: Request, res: Response) {
  try {
    if (!MPESA_CALLBACK_TOKEN || req.params.callbackToken !== MPESA_CALLBACK_TOKEN) {
      return res.status(404).json({ status: 'not found' });
    }

    const payload = req.body;

    // Validate callback
    if (!mpesaService.validateCallback(payload)) {
      const callback = payload.Body.stkCallback;
      console.log('M-Pesa payment failed:', callback.ResultDesc);

      // Find and update payment record
      const payment = await prisma.payment.findFirst({
        where: {
          transactionId: callback.CheckoutRequestID,
        },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            failureReason: callback.ResultDesc,
          },
        });
      }

      return res.json({ status: 'ok' });
    }

    // Extract callback data
    const callbackData = mpesaService.extractCallbackData(payload);
    if (!callbackData) {
      return res.json({ status: 'ok' });
    }

    // Find and update payment record
    const callback = payload.Body.stkCallback;
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: callback.CheckoutRequestID,
      },
    });

    if (!payment) {
      console.error('Payment not found for callback:', callback.CheckoutRequestID);
      return res.json({ status: 'ok' });
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        processedAt: new Date(),
        transactionId: callbackData.transactionId || callback.CheckoutRequestID,
        metadata: { ...(payment.metadata as Record<string, unknown> || {}), callback },
      },
    });

    // Get user for notifications
    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
    });

    if (user) {
      // Send SMS confirmation
      try {
        const amount = callbackData.amount || payment.amount;
        await smsProvider.send(
          user.phone || payment.phoneNumber!,
          SMS_TEMPLATES.PAYMENT_CONFIRMATION(`KSh ${amount}`, payment.id)
        );
      } catch (smsError) {
        console.error('Failed to send SMS confirmation:', smsError);
      }

      // Send push notification
      if (user.pushToken) {
        try {
          await fcmService.sendToToken(
            user.pushToken,
            FCM_TEMPLATES.PAYMENT_RECEIVED(`KSh ${callbackData.amount || payment.amount}`)
          );
        } catch (fcmError) {
          console.error('Failed to send FCM notification:', fcmError);
        }
      }

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'payment_received' as any,
          title: 'Payment Successful',
          message: `Payment of KSh ${callbackData.amount || payment.amount} has been processed`,
        },
      });
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ error: 'Failed to process callback' });
  }
}

export async function checkPaymentStatus(req: Request, res: Response) {
  try {
    const paymentId = String(req.params.paymentId);
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // If pending and using M-Pesa, query status
    if (payment.status === 'pending' && payment.method === 'mpesa' && payment.transactionId) {
      try {
        const status = await mpesaService.queryTransactionStatus(payment.transactionId);
        if (status.resultCode === 0) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'completed', processedAt: new Date() },
          });
          payment.status = 'completed';
        }
      } catch (error) {
        console.error('Failed to query M-Pesa status:', error);
      }
    }

    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      createdAt: payment.createdAt,
      processedAt: payment.processedAt,
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      error: 'Failed to check payment status',
    });
  }
}

export async function getPaymentHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { status, method, limit = '20', offset = '0' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const whereClause: any = { userId };

    if (status) {
      whereClause.status = status;
    }

    if (method) {
      whereClause.method = method;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(String(limit)), 100),
      skip: parseInt(String(offset)),
    });

    const total = await prisma.payment.count({ where: whereClause });

    res.json({
      payments,
      total,
      limit: parseInt(String(limit)),
      offset: parseInt(String(offset)),
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      error: 'Failed to fetch payment history',
    });
  }
}
