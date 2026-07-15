import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getAgents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.location) {
      where.user = {
        agent: {
          serviceAreas: { has: req.query.location as string },
        },
      };
    }
    if (req.query.rating) {
      where.rating = { gte: Number(req.query.rating) };
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatar: true },
          },
        },
      }),
      prisma.agent.count({ where }),
    ]);

    sendPaginated(res, agents, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getAgentById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, bio: true },
        },
        reviews: {
          include: {
            buyer: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!agent) throw new NotFoundError("Agent not found");

    // Get agent's active listings
    const listings = await prisma.listing.findMany({
      where: { userId: agent.userId, status: "active" },
      take: 10,
      include: { property: true },
    });

    sendSuccess(res, { agent: { ...agent, listings } });
  } catch (err) {
    next(err);
  }
}

export async function updateAgent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) throw new NotFoundError("Agent not found");
    if (agent.userId !== req.user!.id) {
      return res.status(403).json({ data: null, error: { code: "UNAUTHORIZED", message: "Unauthorized", statusCode: 403, timestamp: new Date().toISOString() } });
    }

    const { bio, serviceAreas, specialties } = req.body;
    const updated = await prisma.agent.update({
      where: { id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(serviceAreas && { serviceAreas }),
        ...(specialties && { specialties }),
      },
      include: { user: { select: { name: true, email: true } } },
    });

    sendSuccess(res, { agent: updated });
  } catch (err) {
    next(err);
  }
}

export async function contactAgent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!agent) throw new NotFoundError("Agent not found");

    const { message, phone, preferredContact } = req.body;

    const inquiry = await prisma.inquiry.create({
      data: {
        buyerId: req.user!.id,
        agentId: agent.userId,
        message,
        contactMethod: preferredContact || "email",
      },
    });

    sendSuccess(res, { inquiryId: inquiry.id }, 201, "Message sent to agent");
  } catch (err) {
    next(err);
  }
}

export async function getAgentReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const reviews = await prisma.review.findMany({
      where: { agentId: id },
      include: { buyer: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, { reviews });
  } catch (err) {
    next(err);
  }
}

export async function createAgentReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { rating, text } = req.body;

    const review = await prisma.review.create({
      data: {
        agentId: id,
        buyerId: req.user!.id,
        rating,
        text,
      },
    });

    // Update agent's average rating
    const stats = await prisma.review.aggregate({
      where: { agentId: id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.agent.update({
      where: { id },
      data: {
        rating: stats._avg.rating,
        reviewCount: stats._count,
      },
    });

    sendSuccess(res, { review }, 201);
  } catch (err) {
    next(err);
  }
}
