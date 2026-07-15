import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { createNotification } from "../services/notification.js";
import { trackEvent } from "../services/telemetry.js";

export async function getInquiries(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const role = req.query.role as string | undefined;

    const where: any = {};
    if (role === "buyer") {
      where.buyerId = req.user!.id;
    } else if (role === "seller") {
      where.sellerId = req.user!.id;
    } else {
      where.OR = [{ buyerId: req.user!.id }, { sellerId: req.user!.id }, { agentId: req.user!.id }];
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { id: true, name: true, email: true, phone: true } },
          seller: { select: { id: true, name: true } },
          property: { select: { id: true, address: true, city: true, price: true, photos: true } },
          replies: {
            include: { sender: { select: { id: true, name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.inquiry.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

function isInquiryParticipant(inquiry: { buyerId: string; sellerId: string | null; agentId: string | null }, req: AuthRequest): boolean {
  if (req.user!.role === "admin") return true;
  return (
    inquiry.buyerId === req.user!.id ||
    inquiry.sellerId === req.user!.id ||
    inquiry.agentId === req.user!.id
  );
}

export async function getInquiryById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        seller: { select: { id: true, name: true, email: true } },
        property: true,
        replies: {
          include: { sender: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!inquiry) throw new NotFoundError("Inquiry not found");
    if (!isInquiryParticipant(inquiry, req)) throw new AuthorizationError("Unauthorized");
    sendSuccess(res, { inquiry });
  } catch (err) {
    next(err);
  }
}

export async function createInquiry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      propertyId, listingId, agentId, message, contactMethod,
      viewingRequested, viewingDate, viewingTime, proposedOfferPrice,
    } = req.body;

    const inquiry = await prisma.inquiry.create({
      data: {
        buyerId: req.user!.id,
        propertyId,
        listingId,
        agentId,
        message,
        contactMethod,
        viewingRequested,
        viewingDate: viewingDate ? new Date(viewingDate) : undefined,
        viewingTime,
        proposedOfferPrice,
        viewingStatus: viewingRequested ? "requested" : undefined,
      },
    });

    // Increment property inquiry count
    if (propertyId) {
      await prisma.property.update({
        where: { id: propertyId },
        data: { inquiries: { increment: 1 } },
      });
    }

    // Create notification
    if (agentId) {
      await createNotification({
        userId: agentId,
        type: "inquiry",
        title: "New Inquiry",
        message: `You have a new inquiry from ${req.user!.email}`,
        link: `/inquiries/${inquiry.id}`,
      });
    }

    trackEvent("inquiry_sent", req.user!.id, { inquiryId: inquiry.id, viewingRequested: Boolean(viewingRequested) }).catch(() => {});
    sendSuccess(res, { inquiry }, 201, "Inquiry sent successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateInquiryStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundError("Inquiry not found");
    if (!isInquiryParticipant(inquiry, req)) throw new AuthorizationError("Unauthorized");

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { status },
    });

    sendSuccess(res, { inquiry: updated });
  } catch (err) {
    next(err);
  }
}

export async function updateViewingStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { viewingStatus } = req.body;

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundError("Inquiry not found");
    if (!isInquiryParticipant(inquiry, req)) throw new AuthorizationError("Unauthorized");

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { viewingStatus },
    });

    sendSuccess(res, { inquiry: updated });
  } catch (err) {
    next(err);
  }
}

export async function replyToInquiry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { message } = req.body;

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundError("Inquiry not found");
    if (!isInquiryParticipant(inquiry, req)) throw new AuthorizationError("Unauthorized");

    const reply = await prisma.inquiryReply.create({
      data: {
        inquiryId: id,
        senderId: req.user!.id,
        message,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    await prisma.inquiry.update({
      where: { id },
      data: {
        status: "responded",
        respondedAt: new Date(),
      },
    });

    sendSuccess(res, { reply }, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteInquiry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundError("Inquiry not found");
    if (inquiry.buyerId !== req.user!.id && inquiry.sellerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    await prisma.inquiry.delete({ where: { id } });
    sendSuccess(res, null, 200, "Inquiry deleted");
  } catch (err) {
    next(err);
  }
}
