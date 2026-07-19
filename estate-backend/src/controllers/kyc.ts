import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { createNotification } from "../services/notification.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  unverified: ["pending"],
  pending: ["verified", "rejected", "unverified"],
  verified: ["unverified"],
  rejected: ["pending", "unverified"],
};

export async function submitVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { idDocumentUrl, idNumber } = req.body;

    if (!idDocumentUrl || !idNumber) {
      return res.status(400).json({
        data: null,
        error: { code: "VALIDATION_ERROR", message: "idDocumentUrl and idNumber are required", statusCode: 400 },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    if (!VALID_TRANSITIONS[user.verificationStatus]?.includes("pending")) {
      return res.status(400).json({
        data: null,
        error: {
          code: "INVALID_TRANSITION",
          message: `Cannot submit verification from "${user.verificationStatus}" status`,
          statusCode: 400,
        },
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: "pending",
        idDocumentUrl,
        idNumber,
      },
      select: { id: true, verificationStatus: true },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "kyc_submitted",
        title: "New KYC Submission",
        message: `${user.name} has submitted identity verification documents.`,
        link: `/admin/users`,
      });
    }

    sendSuccess(res, { verification: updated }, 200, "Verification submitted successfully");
  } catch (err) {
    next(err);
  }
}

export async function getVerificationStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = String(req.params.id || req.user!.id);

    if (req.user!.id !== userId && req.user!.role !== "admin") {
      throw new AuthorizationError("You can only view your own verification status");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        verificationStatus: true,
        idDocumentUrl: true,
        idNumber: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundError("User not found");

    sendSuccess(res, { verification: user });
  } catch (err) {
    next(err);
  }
}

export async function adminApproveVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const adminId = req.user!.id;
    const userId = String(req.params.id);
    const { action, reason } = req.body;

    if (!["verified", "rejected"].includes(action)) {
      return res.status(400).json({
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Action must be 'verified' or 'rejected'", statusCode: 400 },
      });
    }

    if (action === "rejected" && !reason) {
      return res.status(400).json({
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Rejection reason is required", statusCode: 400 },
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    if (!VALID_TRANSITIONS[user.verificationStatus]?.includes(action)) {
      return res.status(400).json({
        data: null,
        error: {
          code: "INVALID_TRANSITION",
          message: `Cannot ${action} from "${user.verificationStatus}" status`,
          statusCode: 400,
        },
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: action,
      },
      select: { id: true, name: true, verificationStatus: true },
    });

    // Notify user
    if (action === "verified") {
      await createNotification({
        userId,
        type: "kyc_approved",
        title: "Identity Verified",
        message: "Your identity has been verified successfully. You now have full access to all platform features.",
        link: "/dashboard",
      });
    } else {
      await createNotification({
        userId,
        type: "kyc_rejected",
        title: "Verification Rejected",
        message: `Your verification was rejected. Reason: ${reason}. Please resubmit with corrected documents.`,
        link: "/dashboard/settings",
      });
    }

    // If agent, also update the agent.verified field
    if (user.role === "agent") {
      await prisma.agent.updateMany({
        where: { userId },
        data: {
          verified: action === "verified",
          verificationDate: action === "verified" ? new Date() : null,
        },
      });
    }

    sendSuccess(res, { user: updated }, 200, `Verification ${action}`);
  } catch (err) {
    next(err);
  }
}

export async function getPendingVerifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { verificationStatus: "pending" as const };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          verificationStatus: true,
          idDocumentUrl: true,
          idNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}
