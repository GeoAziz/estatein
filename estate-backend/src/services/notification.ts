import prisma from "../config/database.js";
import logger from "../middleware/logging.js";
import { cacheGet, cacheSet, cacheDel } from "./cache.js";

export type NotificationType =
  | "inquiry"
  | "viewing"
  | "message"
  | "listing_approved"
  | "listing_rejected"
  | "favorite"
  | "system"
  | "price_alert"
  | "new_matching_property"
  | "payment_received"
  | "kyc_submitted"
  | "kyc_approved"
  | "kyc_rejected";

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({ data });
    // Invalidate unread count cache
    await cacheDel(`notif:unread:${data.userId}`);
    return notification;
  } catch (err) {
    logger.error({ err, userId: data.userId }, "Failed to create notification");
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const cacheKey = `notif:unread:${userId}`;
  const cached = await cacheGet<number>(cacheKey);
  if (cached !== null) return cached;

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  await cacheSet(cacheKey, count, 300); // Cache 5 minutes
  return count;
}

export async function markAsRead(notificationId: string, userId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
  await cacheDel(`notif:unread:${userId}`);
  return result;
}

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  await cacheDel(`notif:unread:${userId}`);
  return result;
}
