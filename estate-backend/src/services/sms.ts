// SMS notification service for Kenya

import axios from 'axios';

export interface SmsConfig {
  provider: 'africastalking' | 'vonage' | 'twilio';
  apiKey: string;
  apiSecret?: string;
  senderId?: string;
  fromNumber?: string;
}

export interface SmsMessage {
  phoneNumber: string;
  message: string;
  timestamp?: Date;
}

abstract class SmsProvider {
  protected config: SmsConfig;

  constructor(config: SmsConfig) {
    this.config = config;
  }

  abstract send(phoneNumber: string, message: string): Promise<{ messageId: string; status: string }>;

  protected formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('0')) {
      return '+254' + cleaned.substring(1);
    }
    if (cleaned.startsWith('254')) {
      return '+' + cleaned;
    }
    return '+254' + cleaned;
  }
}

class AfricasTalkingSmsProvider extends SmsProvider {
  async send(phoneNumber: string, message: string): Promise<{ messageId: string; status: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await axios.post('https://api.sandbox.africastalking.com/version1/messaging', {
        username: this.config.senderId || 'estatein',
        ApiKey: this.config.apiKey,
        recipients: [
          {
            phoneNumber: formattedPhone,
            message: message,
          },
        ],
      });

      if (response.data.SMSMessageData?.Recipients?.[0]) {
        const recipient = response.data.SMSMessageData.Recipients[0];
        return {
          messageId: recipient.messageId,
          status: recipient.status === 'Success' ? 'sent' : 'failed',
        };
      }

      throw new Error('Invalid response from SMS provider');
    } catch (error) {
      console.error('Failed to send SMS via Africa\'s Talking:', error);
      throw error;
    }
  }
}

class VonageSmsProvider extends SmsProvider {
  async send(phoneNumber: string, message: string): Promise<{ messageId: string; status: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const response = await axios.post('https://rest.nexmo.com/sms/json', {
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        to: formattedPhone,
        from: this.config.senderId || 'ESTATEIN',
        text: message,
      });

      if (response.data.messages?.[0]) {
        const msg = response.data.messages[0];
        return {
          messageId: msg['message-id'],
          status: msg.status === '0' ? 'sent' : 'failed',
        };
      }

      throw new Error('Invalid response from SMS provider');
    } catch (error) {
      console.error('Failed to send SMS via Vonage:', error);
      throw error;
    }
  }
}

class TwilioSmsProvider extends SmsProvider {
  async send(phoneNumber: string, message: string): Promise<{ messageId: string; status: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const auth = Buffer.from(`${this.config.senderId}:${this.config.apiKey}`).toString('base64');

      const response = await axios.post(
        'https://api.twilio.com/2010-04-01/Accounts/' + this.config.senderId + '/Messages.json',
        {
          From: this.config.fromNumber,
          To: formattedPhone,
          Body: message,
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return {
        messageId: response.data.sid,
        status: response.data.status === 'queued' ? 'sent' : response.data.status,
      };
    } catch (error) {
      console.error('Failed to send SMS via Twilio:', error);
      throw error;
    }
  }
}

export function createSmsProvider(config: SmsConfig): SmsProvider {
  switch (config.provider) {
    case 'africastalking':
      return new AfricasTalkingSmsProvider(config);
    case 'vonage':
      return new VonageSmsProvider(config);
    case 'twilio':
      return new TwilioSmsProvider(config);
    default:
      throw new Error(`Unknown SMS provider: ${config.provider}`);
  }
}

// Notification message templates
export const SMS_TEMPLATES = {
  VERIFICATION_CODE: (code: string) =>
    `Your EstateIn verification code is: ${code}. Valid for 10 minutes.`,
  PROPERTY_INQUIRY: (propertyName: string) =>
    `You have a new inquiry for ${propertyName}. Check EstateIn app for details.`,
  VIEWING_REMINDER: (address: string, time: string) =>
    `Reminder: Your property viewing for ${address} is scheduled at ${time}.`,
  OFFER_RECEIVED: (amount: string) =>
    `You have received an offer of ${amount}. Review and respond in EstateIn app.`,
  PAYMENT_CONFIRMATION: (amount: string, ref: string) =>
    `Payment of ${amount} confirmed. Ref: ${ref}. Thank you for using EstateIn.`,
  PASSWORD_RESET: (link: string) =>
    `Reset your EstateIn password: ${link}. Link valid for 1 hour.`,
};
