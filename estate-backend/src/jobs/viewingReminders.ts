import cron from 'node-cron';
import prisma from '../config/database.js';
import { createSmsProvider, SMS_TEMPLATES } from '../services/sms.js';
import { fcmService, FCM_TEMPLATES } from '../services/fcm.js';
import { createNotification } from '../services/notification.js';

const smsProvider = createSmsProvider({
  provider: (process.env.SMS_PROVIDER || 'africastalking') as any,
  apiKey: process.env.SMS_API_KEY || '',
  apiSecret: process.env.SMS_API_SECRET,
  senderId: process.env.SMS_SENDER_ID || 'ESTATEIN',
});

/**
 * Send 24-hour before viewing reminders via SMS, FCM push, and in-app notification.
 * Runs every hour to find inquiries with viewings in the 23-25 hour window.
 */
export function startViewingReminderJob() {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const upcomingInquiries = await prisma.inquiry.findMany({
        where: {
          viewingStatus: 'confirmed',
          reminderSent: false,
          viewingDate: {
            gte: in23Hours,
            lte: in25Hours,
          },
        },
        include: {
          buyer: { select: { id: true, name: true, phone: true, pushToken: true } },
          property: { select: { id: true, address: true, city: true } },
        },
      });

      for (const inquiry of upcomingInquiries) {
        try {
          const propertyName = inquiry.property?.address || 'the property';
          const viewingTime = inquiry.viewingTime || 'the scheduled time';
          const message = SMS_TEMPLATES.VIEWING_REMINDER
            ? SMS_TEMPLATES.VIEWING_REMINDER(propertyName, viewingTime)
            : `Reminder: Your property viewing for ${propertyName} is scheduled for ${viewingTime} tomorrow.`;

          if (inquiry.buyer.phone) {
            await smsProvider.send(inquiry.buyer.phone, message).catch((err) => {
              console.error(`SMS reminder failed for inquiry ${inquiry.id}:`, err);
            });
          }

          if (inquiry.buyer.pushToken) {
            const fcmMessage = FCM_TEMPLATES.VIEWING_REMINDER
              ? FCM_TEMPLATES.VIEWING_REMINDER(propertyName, viewingTime)
              : { title: 'Viewing Reminder', body: message };
            await fcmService.sendToToken(inquiry.buyer.pushToken, fcmMessage).catch((err) => {
              console.error(`Push reminder failed for inquiry ${inquiry.id}:`, err);
            });
          }

          await createNotification({
            userId: inquiry.buyer.id,
            type: 'viewing',
            title: 'Viewing Reminder',
            message,
            link: inquiry.property?.id ? `/properties/${inquiry.property.id}` : undefined,
          });

          await prisma.inquiry.update({
            where: { id: inquiry.id },
            data: { reminderSent: true },
          });

          console.log(`Viewing reminder sent for inquiry ${inquiry.id}`);
        } catch (error) {
          console.error(`Failed to send reminder for inquiry ${inquiry.id}:`, error);
        }
      }

      if (upcomingInquiries.length > 0) {
        console.log(`Viewing reminder job completed. Sent ${upcomingInquiries.length} reminders.`);
      }
    } catch (error) {
      console.error('Error in viewing reminder job:', error);
    }
  });

  console.log('Viewing reminder job started (runs hourly)');
}
