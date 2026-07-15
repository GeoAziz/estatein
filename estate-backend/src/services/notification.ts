import prisma from "../config/database.js";
import logger from "../middleware/logging.js";

export async function createNotification(data: {
  userId: string;
  type: "inquiry" | "viewing" | "message" | "listing_approved" | "listing_rejected" | "favorite" | "system";
  title: string;
  message: string;
  link?: string;
}) {
  try {
    return await prisma.notification.create({ data });
  } catch (err) {
    logger.error({ err, userId: data.userId }, "Failed to create notification");
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
