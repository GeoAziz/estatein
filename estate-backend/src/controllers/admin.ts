import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { createNotification } from "../services/notification.js";
import { trackEvent } from "../services/telemetry.js";

export async function getPendingListings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { status: "pending" as const };

    const [data, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          property: true,
        },
      }),
      prisma.listing.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function approveListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { notes, reason } = req.body;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!listing) throw new NotFoundError("Listing not found");

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: "active" },
      include: { property: true },
    });

    // Notify agent
    await createNotification({
      userId: listing.userId,
      type: "listing_approved",
      title: "Listing Approved",
      message: `Your listing "${listing.title}" has been approved and is now live.`,
      link: `/listings/${id}`,
    });

    trackEvent("listing_approved", req.user!.id, { listingId: id }).catch(() => {});
    sendSuccess(res, { listing: updated, success: true }, 200, "Listing approved");
  } catch (err) {
    next(err);
  }
}

export async function rejectListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { reason } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundError("Listing not found");

    await prisma.listing.update({
      where: { id },
      data: { status: "rejected" },
    });

    await createNotification({
      userId: listing.userId,
      type: "listing_rejected",
      title: "Listing Rejected",
      message: `Your listing "${listing.title}" was rejected. Reason: ${reason}`,
      link: `/listings/${id}`,
    });

    sendSuccess(res, { success: true }, 200, "Listing rejected");
  } catch (err) {
    next(err);
  }
}

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const role = req.query.role as string | undefined;

    const where: any = {};
    if (role) where.role = role;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          verificationStatus: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User not found");

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: status === "active",
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    sendSuccess(res, { user: updated });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [totalUsers, totalListings, pendingApprovals, activeListings, pendingVerifications] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "pending" } }),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.user.count({ where: { verificationStatus: "pending" } }),
    ]);

    const totalInquiries = await prisma.inquiry.count();

    sendSuccess(res, {
      totalUsers,
      totalListings,
      totalInquiries,
      pendingApprovals,
      activeListings,
      pendingVerifications,
    });
  } catch (err) {
    next(err);
  }
}

export async function reindexProperties(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reindexAllProperties } = await import("../services/elasticsearch.js");
    const count = await reindexAllProperties();
    sendSuccess(res, { reindexed: count }, 200, `Reindexed ${count} properties`);
  } catch (err) {
    next(err);
  }
}
