import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export async function getUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        role: true,
        verificationStatus: true,
        createdAt: true,
        agent: {
          select: {
            brokerage: true,
            licenseNumber: true,
            licenseState: true,
            yearsExperience: true,
            serviceAreas: true,
            specialties: true,
            totalSales: true,
            averageSalePrice: true,
            rating: true,
            reviewCount: true,
            verified: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundError("User not found");
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    if (req.user!.id !== id && req.user!.role !== "admin") {
      throw new AuthorizationError("You can only update your own profile");
    }

    const { name, phone, avatar, bio, company, license, licenseState, serviceAreas } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar && { avatar }),
        ...(bio !== undefined && { bio }),
      },
      select: { id: true, name: true, email: true, phone: true, avatar: true, bio: true, role: true },
    });

    // Update agent-specific fields
    if (req.user!.role === "agent") {
      await prisma.agent.updateMany({
        where: { userId: id },
        data: {
          ...(company && { brokerage: company }),
          ...(license && { licenseNumber: license }),
          ...(licenseState && { licenseState }),
          ...(serviceAreas && { serviceAreas }),
        },
      });
    }

    sendSuccess(res, { user }, 200, "Profile updated successfully");
  } catch (err) {
    next(err);
  }
}

export async function getUserActivity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    if (req.user!.id !== id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    const activities = await prisma.activityLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    sendSuccess(res, { activities });
  } catch (err) {
    next(err);
  }
}
