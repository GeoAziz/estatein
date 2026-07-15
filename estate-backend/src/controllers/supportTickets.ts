import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getSupportTickets(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, priority, assignedTo } = req.query as Record<string, string | undefined>;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (req.user!.role !== "admin") where.userId = req.user!.id;

    const [data, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getSupportTicketById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!ticket) throw new NotFoundError("Support ticket not found");
    if (ticket.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    sendSuccess(res, { ticket });
  } catch (err) {
    next(err);
  }
}

export async function createSupportTicket(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { subject, description, category, priority } = req.body;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user!.id,
        subject,
        description,
        category,
        priority: priority || "medium",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    sendSuccess(res, { ticket }, 201, "Support ticket created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateSupportTicket(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundError("Support ticket not found");

    if (req.user!.role !== "admin" && ticket.userId !== req.user!.id) {
      throw new AuthorizationError("Unauthorized");
    }

    const { subject, description, category, priority, status, assignedTo } = req.body;
    const isAdmin = req.user!.role === "admin";

    const updateData: any = {
      ...(subject !== undefined && { subject }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      // Non-admins may only close their own ticket, not set arbitrary status.
      ...(status !== undefined && (isAdmin || status === "closed") && { status }),
      // Priority and assignment are admin-only triage fields.
      ...(isAdmin && priority !== undefined && { priority }),
      ...(isAdmin && assignedTo !== undefined && { assignedTo }),
    };
    if (updateData.status === "resolved") updateData.resolvedAt = new Date();

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    sendSuccess(res, { ticket: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteSupportTicket(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundError("Support ticket not found");
    if (ticket.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    await prisma.supportTicket.delete({ where: { id } });
    sendSuccess(res, null, 200, "Support ticket deleted successfully");
  } catch (err) {
    next(err);
  }
}
