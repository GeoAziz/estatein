import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { createNotification } from "../services/notification.js";
import { trackEvent } from "../services/telemetry.js";
import { createSmsProvider, SMS_TEMPLATES } from "../services/sms.js";

const smsProvider = createSmsProvider({
  provider: (process.env.SMS_PROVIDER || "africastalking") as any,
  apiKey: process.env.SMS_API_KEY || "",
  apiSecret: process.env.SMS_API_SECRET,
  senderId: process.env.SMS_SENDER_ID || "ESTATEIN",
});

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
      viewingRequested, viewingDate, viewingTime, proposedOfferPrice, slotId,
    } = req.body;

    let resolvedViewingDate = viewingDate ? new Date(viewingDate) : undefined;
    let resolvedViewingTime = viewingTime;

    if (slotId) {
      const slot = await prisma.agentAvailabilitySlot.findUnique({ where: { id: slotId } });
      if (!slot) throw new NotFoundError("Availability slot not found");
      if (slot.isBooked) throw new AuthorizationError("This slot has already been booked");
      resolvedViewingDate = slot.date;
      resolvedViewingTime = slot.startTime;
    }

    // Wrap slot booking + inquiry creation in a transaction so two buyers
    // racing for the same slot can't both succeed.
    const inquiry = await prisma.$transaction(async (tx) => {
      if (slotId) {
        const claimed = await tx.agentAvailabilitySlot.updateMany({
          where: { id: slotId, isBooked: false },
          data: { isBooked: true },
        });
        if (claimed.count === 0) {
          throw new AuthorizationError("This slot has already been booked");
        }
      }

      return tx.inquiry.create({
        data: {
          buyerId: req.user!.id,
          propertyId,
          listingId,
          agentId,
          slotId: slotId || undefined,
          message,
          contactMethod,
          viewingRequested: viewingRequested || Boolean(slotId),
          viewingDate: resolvedViewingDate,
          viewingTime: resolvedViewingTime,
          proposedOfferPrice,
          viewingStatus: (viewingRequested || slotId) ? "requested" : undefined,
        },
      });
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

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { buyer: true, property: { select: { address: true, city: true } } },
    });
    if (!inquiry) throw new NotFoundError("Inquiry not found");
    if (!isInquiryParticipant(inquiry, req)) throw new AuthorizationError("Unauthorized");

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { viewingStatus },
    });

    if (viewingStatus === "confirmed") {
      await notifyViewingConfirmed(inquiry);
    }

    // Free the associated availability slot when a viewing is cancelled.
    if (viewingStatus === "cancelled" && inquiry.slotId) {
      await prisma.agentAvailabilitySlot.update({
        where: { id: inquiry.slotId },
        data: { isBooked: false },
      }).catch(() => {});
    }

    sendSuccess(res, { inquiry: updated });
  } catch (err) {
    next(err);
  }
}

export async function updateViewingSchedule(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { viewingDate, viewingTime } = req.body;

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundError("Inquiry not found");
    if (!isInquiryParticipant(inquiry, req)) throw new AuthorizationError("Unauthorized");
    if (!inquiry.viewingRequested) throw new AuthorizationError("This inquiry has no viewing to reschedule");

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        viewingDate: viewingDate ? new Date(viewingDate) : inquiry.viewingDate,
        viewingTime: viewingTime ?? inquiry.viewingTime,
        // A reschedule needs re-confirmation from whichever side didn't initiate it.
        viewingStatus: "requested",
      },
    });

    await createNotification({
      userId: inquiry.buyerId,
      type: "viewing",
      title: "Viewing rescheduled",
      message: `Your property viewing has been rescheduled to ${updated.viewingDate?.toDateString()} at ${updated.viewingTime}.`,
      link: `/dashboard/buyer`,
    });

    sendSuccess(res, { inquiry: updated });
  } catch (err) {
    next(err);
  }
}

async function notifyViewingConfirmed(inquiry: {
  buyerId: string;
  buyer: { phone: string | null; name: string };
  property: { address: string; city: string } | null;
  viewingDate: Date | null;
  viewingTime: string | null;
}) {
  const address = inquiry.property ? `${inquiry.property.address}, ${inquiry.property.city}` : "the property";
  const when = `${inquiry.viewingDate?.toDateString() ?? ""} at ${inquiry.viewingTime ?? ""}`;

  await createNotification({
    userId: inquiry.buyerId,
    type: "viewing",
    title: "Viewing confirmed",
    message: `Your viewing for ${address} is confirmed for ${when}.`,
    link: `/dashboard/buyer`,
  });

  if (inquiry.buyer.phone) {
    try {
      await smsProvider.send(inquiry.buyer.phone, SMS_TEMPLATES.VIEWING_REMINDER(address, when));
    } catch {
      // Best-effort — SMS failures shouldn't block the confirm action.
    }
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
