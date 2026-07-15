import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export async function exportUserData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        bio: true,
        role: true,
        preferredCurrency: true,
        createdAt: true,
        updatedAt: true,
        listings: {
          select: {
            id: true,
            title: true,
            description: true,
            listingType: true,
            price: true,
            status: true,
            createdAt: true,
          },
        },
        favorites: {
          select: {
            id: true,
            propertyId: true,
            notes: true,
            createdAt: true,
          },
        },
        savedSearches: {
          select: {
            id: true,
            name: true,
            searchType: true,
            location: true,
            filters: true,
            createdAt: true,
          },
        },
        notifications: {
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            createdAt: true,
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            title: true,
            url: true,
            uploadedAt: true,
          },
        },
        sentInquiries: {
          select: {
            id: true,
            subject: true,
            message: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundError("User not found");

    // Log the export
    await prisma.activityLog.create({
      data: {
        userId,
        action: "data_export_requested",
        details: { exportedAt: new Date().toISOString() },
      },
    });

    sendSuccess(res, {
      exportDate: new Date().toISOString(),
      userData: user,
      message: "Your data export has been generated",
    });
  } catch (err) {
    next(err);
  }
}

export async function requestDataDeletion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    if (user.deletionRequestedAt) {
      sendSuccess(res, {
        message: "Deletion already requested",
        deletionRequestedAt: user.deletionRequestedAt,
      });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: new Date(),
        isActive: false,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "gdpr_deletion_requested",
        details: {
          requestedAt: new Date().toISOString(),
          note: "GDPR Article 17 - Right to erasure",
        },
      },
    });

    sendSuccess(res, {
      message:
        "Your data deletion request has been received. Personal data will be permanently deleted within 30 days per GDPR Article 17.",
      deletionRequestedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDataProcessingLog(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const processingLog = activities.map((log) => ({
      action: log.action,
      timestamp: log.createdAt,
      details: log.details,
    }));

    sendSuccess(res, {
      userId,
      totalEntries: processingLog.length,
      log: processingLog,
      message: "Data processing log retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
}
