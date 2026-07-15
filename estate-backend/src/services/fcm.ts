// Firebase Cloud Messaging service for push notifications

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

export interface FcmMessage {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  sound?: string;
  tag?: string;
  clickAction?: string;
  data?: Record<string, string>;
}

export interface FcmOptions {
  priority?: 'high' | 'normal';
  ttl?: number;
  collapseKey?: string;
}

class FcmService {
  private initialized: boolean = false;
  private messaging: Messaging | null = null;
  private app: App | null = null;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      if (getApps().length === 0) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : null;

        if (serviceAccount && serviceAccount.project_id) {
          this.app = initializeApp({
            credential: cert(serviceAccount),
          });
        } else {
          console.warn('Firebase credentials not configured - push notifications disabled');
          return;
        }
      } else {
        this.app = getApps()[0];
      }

      this.messaging = getMessaging(this.app);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }

  async sendToToken(
    deviceToken: string,
    message: FcmMessage,
    options?: FcmOptions
  ): Promise<string> {
    if (!this.initialized || !this.messaging) {
      throw new Error('Firebase is not initialized');
    }

    try {
      const response = await this.messaging.send({
        token: deviceToken,
        notification: {
          title: message.title,
          body: message.body,
        },
        android: {
          priority: options?.priority || 'high',
          ttl: options?.ttl || 86400000,
          notification: {
            icon: message.icon,
            sound: message.sound || 'default',
            clickAction: message.clickAction,
            tag: message.tag,
          },
        },
        data: message.data,
      });

      return response;
    } catch (error) {
      console.error('Failed to send FCM notification:', error);
      throw error;
    }
  }

  async sendToTopic(
    topic: string,
    message: FcmMessage,
    options?: FcmOptions
  ): Promise<string> {
    if (!this.initialized || !this.messaging) {
      throw new Error('Firebase is not initialized');
    }

    try {
      const response = await this.messaging.send({
        topic,
        notification: {
          title: message.title,
          body: message.body,
        },
        android: {
          priority: options?.priority || 'high',
          ttl: options?.ttl || 86400000,
          notification: {
            icon: message.icon,
            sound: message.sound || 'default',
            clickAction: message.clickAction,
          },
        },
        data: message.data,
      });

      return response;
    } catch (error) {
      console.error('Failed to send FCM topic notification:', error);
      throw error;
    }
  }

  async sendToMultiple(
    deviceTokens: string[],
    message: FcmMessage,
    options?: FcmOptions
  ): Promise<{ success: number; failure: number }> {
    if (!this.initialized || !this.messaging) {
      throw new Error('Firebase is not initialized');
    }

    try {
      const response = await this.messaging.sendEachForMulticast({
        tokens: deviceTokens,
        notification: {
          title: message.title,
          body: message.body,
        },
        android: {
          priority: options?.priority || 'high',
          ttl: options?.ttl || 86400000,
          notification: {
            icon: message.icon,
            sound: message.sound || 'default',
            clickAction: message.clickAction,
          },
        },
        data: message.data,
      });

      return {
        success: response.successCount,
        failure: response.failureCount,
      };
    } catch (error) {
      console.error('Failed to send multicast FCM notification:', error);
      throw error;
    }
  }

  async subscribeToTopic(deviceToken: string, topic: string): Promise<void> {
    if (!this.initialized || !this.messaging) {
      throw new Error('Firebase is not initialized');
    }

    try {
      await this.messaging.subscribeToTopic([deviceToken], topic);
    } catch (error) {
      console.error('Failed to subscribe to FCM topic:', error);
      throw error;
    }
  }

  async unsubscribeFromTopic(deviceToken: string, topic: string): Promise<void> {
    if (!this.initialized || !this.messaging) {
      throw new Error('Firebase is not initialized');
    }

    try {
      await this.messaging.unsubscribeFromTopic([deviceToken], topic);
    } catch (error) {
      console.error('Failed to unsubscribe from FCM topic:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const fcmService = new FcmService();

// Notification templates
export const FCM_TEMPLATES = {
  NEW_INQUIRY: (propertyName: string): FcmMessage => ({
    title: 'New Inquiry',
    body: `You have a new inquiry for ${propertyName}`,
    icon: '/icons/inquiry.png',
    clickAction: 'OPEN_INQUIRIES',
  }),

  VIEWING_REMINDER: (address: string, time: string): FcmMessage => ({
    title: 'Viewing Reminder',
    body: `Don't forget your viewing at ${address} at ${time}`,
    icon: '/icons/viewing.png',
    clickAction: 'OPEN_VIEWINGS',
  }),

  LISTING_APPROVED: (title: string): FcmMessage => ({
    title: 'Listing Approved',
    body: `Your listing "${title}" has been approved and is now live`,
    icon: '/icons/approved.png',
    clickAction: 'OPEN_LISTINGS',
  }),

  PRICE_ALERT: (location: string, price: string): FcmMessage => ({
    title: 'Price Alert',
    body: `New property in ${location} at ${price}`,
    icon: '/icons/alert.png',
    clickAction: 'OPEN_SEARCH',
  }),

  PAYMENT_RECEIVED: (amount: string): FcmMessage => ({
    title: 'Payment Received',
    body: `Payment of ${amount} has been received`,
    icon: '/icons/payment.png',
    clickAction: 'OPEN_PAYMENTS',
  }),

  MESSAGE_NOTIFICATION: (senderName: string): FcmMessage => ({
    title: 'New Message',
    body: `${senderName} sent you a message`,
    icon: '/icons/message.png',
    sound: 'default',
    clickAction: 'OPEN_MESSAGES',
  }),
};
