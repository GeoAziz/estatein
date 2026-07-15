// M-Pesa payment integration service for Kenya

import axios from 'axios';

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

export interface MpesaInitiateResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: any;
        }>;
      };
    };
  };
}

export interface MpesaTransaction {
  transactionId: string;
  phone: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

class MpesaService {
  private config: MpesaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: MpesaConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString('base64');

      const response = await axios.get(
        `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      this.accessToken = response.data.access_token as string;
      // Set expiry to 1 hour from now (but refresh after 50 minutes to be safe)
      this.tokenExpiry = Date.now() + 50 * 60 * 1000;

      return this.accessToken!;
    } catch (error) {
      console.error('Failed to get M-Pesa access token:', error);
      throw error;
    }
  }

  async initiatePayment(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    description: string
  ): Promise<MpesaInitiateResponse> {
    try {
      // Format phone number to international format if needed
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = Buffer.from(
        `${this.config.businessShortCode}${this.config.passkey}${timestamp}`
      ).toString('base64');

      const response = await axios.post(
        `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.config.businessShortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.floor(amount),
          PartyA: formattedPhone,
          PartyB: this.config.businessShortCode,
          PhoneNumber: formattedPhone,
          CallBackURL: this.config.callbackUrl,
          AccountReference: accountReference,
          TransactionDesc: description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to initiate M-Pesa payment:', error);
      throw error;
    }
  }

  async queryTransactionStatus(
    checkoutRequestId: string
  ): Promise<{ status: string; resultCode: number }> {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = Buffer.from(
        `${this.config.businessShortCode}${this.config.passkey}${timestamp}`
      ).toString('base64');

      const response = await axios.post(
        `${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.config.businessShortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        status:
          response.data.ResultCode === '0'
            ? 'completed'
            : response.data.ResultCode === '1032'
              ? 'pending'
              : 'failed',
        resultCode: response.data.ResultCode,
      };
    } catch (error) {
      console.error('Failed to query M-Pesa transaction status:', error);
      throw error;
    }
  }

  validateCallback(payload: MpesaCallbackPayload): boolean {
    const callback = payload.Body.stkCallback;
    return callback.ResultCode === 0;
  }

  extractCallbackData(payload: MpesaCallbackPayload): Partial<MpesaTransaction> | null {
    const callback = payload.Body.stkCallback;

    if (callback.ResultCode !== 0) {
      return null;
    }

    const metadata = callback.CallbackMetadata?.Item || [];
    const data: Partial<MpesaTransaction> = {
      status: 'completed',
      timestamp: new Date(),
    };

    for (const item of metadata) {
      switch (item.Name) {
        case 'Amount':
          data.amount = item.Value;
          break;
        case 'MpesaReceiptNumber':
          data.transactionId = item.Value;
          break;
        case 'PhoneNumber':
          data.phone = item.Value;
          break;
      }
    }

    return data;
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any existing +, spaces, or dashes
    const cleaned = phone.replace(/[^\d]/g, '');

    // If it starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    }

    // If it starts with 254, return as is
    if (cleaned.startsWith('254')) {
      return cleaned;
    }

    // Otherwise prepend 254
    return '254' + cleaned;
  }

  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${date}${hours}${minutes}${seconds}`;
  }
}

export default MpesaService;
