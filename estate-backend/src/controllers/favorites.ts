import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getFavorites(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { userId: req.user!.id };

    const [data, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            include: { neighborhood: { select: { name: true, city: true } } },
          },
        },
      }),
      prisma.favorite.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const propertyId = String(req.params.propertyId);
    const { notes } = req.body;

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundError("Property not found");

    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: req.user!.id, propertyId } },
    });

    if (existing) {
      return sendSuccess(res, { favorite: existing }, 200, "Already in favorites");
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user!.id,
        propertyId,
        notes,
      },
      include: { property: true },
    });

    await prisma.property.update({
      where: { id: propertyId },
      data: { favorites: { increment: 1 } },
    });

    sendSuccess(res, { favorite }, 201, "Added to favorites");
  } catch (err) {
    next(err);
  }
}

export async function removeFavorite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const propertyId = String(req.params.propertyId);

    await prisma.favorite.deleteMany({
      where: { userId: req.user!.id, propertyId },
    });

    await prisma.property.update({
      where: { id: propertyId },
      data: { favorites: { decrement: 1 } },
    }).catch(() => {});

    sendSuccess(res, null, 200, "Removed from favorites");
  } catch (err) {
    next(err);
  }
}

export async function checkFavorite(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const propertyId = String(req.params.propertyId);
    const favorite = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: req.user!.id, propertyId } },
    });

    sendSuccess(res, { isFavorited: !!favorite, favorite });
  } catch (err) {
    next(err);
  }
}
