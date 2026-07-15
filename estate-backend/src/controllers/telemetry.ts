import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { sendSuccess } from "../utils/response.js";
import { logError, trackEvent } from "../services/telemetry.js";

export async function reportError(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { message, stack, context, url } = req.body;
    await logError({ source: "frontend", message, stack, context, url, userId: req.user?.id });
    sendSuccess(res, { received: true }, 201);
  } catch (err) {
    next(err);
  }
}

export async function trackClientEvent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, metadata } = req.body;
    await trackEvent(name, req.user?.id, metadata);
    sendSuccess(res, { received: true }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getEventCounts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const events = await prisma.analyticsEvent.groupBy({
      by: ["name"],
      _count: { name: true },
    });
    sendSuccess(res, {
      counts: Object.fromEntries(events.map((e) => [e.name, e._count.name])),
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentErrors(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const errors = await prisma.errorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    sendSuccess(res, { errors });
  } catch (err) {
    next(err);
  }
}
