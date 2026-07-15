import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { AuthenticationError, NotFoundError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export async function deactivate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    // Verify password before deactivation
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError("Invalid password");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    sendSuccess(res, { message: "Account deactivated successfully" });
  } catch (err) {
    next(err);
  }
}

export async function reactivate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    if (user.isActive) {
      sendSuccess(res, { message: "Account is already active" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        deactivatedAt: null,
      },
    });

    sendSuccess(res, { message: "Account reactivated successfully" });
  } catch (err) {
    next(err);
  }
}

export async function requestDeletion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    if (user.deletionRequestedAt) {
      sendSuccess(res, { message: "Deletion already requested" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: new Date(),
        isActive: false,
      },
    });

    // Log the deletion request
    await prisma.activityLog.create({
      data: {
        userId,
        action: "account_deletion_requested",
        details: { requestedAt: new Date().toISOString() },
      },
    });

    sendSuccess(res, {
      message: "Account deletion requested. Data will be permanently deleted after 30 days.",
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelDeletion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    if (!user.deletionRequestedAt) {
      sendSuccess(res, { message: "No pending deletion request" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: null,
        isActive: true,
        deactivatedAt: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "account_deletion_cancelled",
        details: { cancelledAt: new Date().toISOString() },
      },
    });

    sendSuccess(res, { message: "Account deletion cancelled successfully" });
  } catch (err) {
    next(err);
  }
}
