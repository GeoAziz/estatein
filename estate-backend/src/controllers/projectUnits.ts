import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getUnitsByPhase(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const phaseId = String(req.params.phaseId);
    const phase = await prisma.projectPhase.findUnique({ where: { id: phaseId } });
    if (!phase) throw new NotFoundError("Project phase not found");

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, minPrice, maxPrice } = req.query as Record<string, string | undefined>;

    const where: any = { phaseId };
    if (status) where.status = status;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    const [data, total] = await Promise.all([
      prisma.projectUnit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { unitNumber: "asc" },
      }),
      prisma.projectUnit.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getUnitById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const unit = await prisma.projectUnit.findUnique({
      where: { id },
      include: {
        phase: {
          include: {
            project: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!unit) throw new NotFoundError("Project unit not found");
    sendSuccess(res, { unit });
  } catch (err) {
    next(err);
  }
}

export async function createUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const phaseId = String(req.params.phaseId);
    const phase = await prisma.projectPhase.findUnique({
      where: { id: phaseId },
      include: { project: true },
    });
    if (!phase) throw new NotFoundError("Project phase not found");
    if (phase.project.developerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    const { unitNumber, unitType, bedrooms, bathrooms, sqFt, floor, price, currency, features, photos } = req.body;

    const unit = await prisma.projectUnit.create({
      data: {
        phaseId,
        unitNumber,
        unitType,
        bedrooms,
        bathrooms,
        sqFt,
        floor,
        price,
        currency: currency || "KSH",
        features: features || [],
        photos: photos || [],
      },
    });

    sendSuccess(res, { unit }, 201, "Unit created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const unit = await prisma.projectUnit.findUnique({
      where: { id },
      include: { phase: { include: { project: true } } },
    });
    if (!unit) throw new NotFoundError("Project unit not found");
    if (unit.phase.project.developerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    const updated = await prisma.projectUnit.update({
      where: { id },
      data: req.body,
    });

    sendSuccess(res, { unit: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const unit = await prisma.projectUnit.findUnique({
      where: { id },
      include: { phase: { include: { project: true } } },
    });
    if (!unit) throw new NotFoundError("Project unit not found");
    if (unit.phase.project.developerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    await prisma.projectUnit.delete({ where: { id } });
    sendSuccess(res, null, 200, "Unit deleted successfully");
  } catch (err) {
    next(err);
  }
}

export async function reserveUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const unit = await prisma.projectUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundError("Project unit not found");
    if (unit.status !== "available") throw new AuthorizationError("Unit is not available for reservation");

    const updated = await prisma.projectUnit.update({
      where: { id },
      data: { status: "reserved" },
    });

    sendSuccess(res, { unit: updated }, 200, "Unit reserved successfully");
  } catch (err) {
    next(err);
  }
}
