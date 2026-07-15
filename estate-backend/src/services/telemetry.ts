import type { Prisma } from "@prisma/client";
import prisma from "../config/database.js";
import logger from "../middleware/logging.js";

export async function logError(data: {
  source: "frontend" | "backend";
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
  url?: string;
}) {
  try {
    await prisma.errorLog.create({
      data: { ...data, context: data.context as Prisma.InputJsonValue | undefined },
    });
  } catch (err) {
    // Telemetry must never take down the request it's observing.
    logger.error({ err }, "Failed to persist error log");
  }
}

export async function trackEvent(name: string, userId?: string, metadata?: Record<string, unknown>) {
  try {
    await prisma.analyticsEvent.create({
      data: { name, userId, metadata: metadata as Prisma.InputJsonValue | undefined },
    });
  } catch (err) {
    logger.error({ err, name }, "Failed to persist analytics event");
  }
}
