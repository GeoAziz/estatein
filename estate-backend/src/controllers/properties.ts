import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { searchProperties } from "../services/search.js";

export async function getProperties(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await searchProperties(req.query as any);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
}

export async function getPropertyById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        neighborhood: true,
        nearbySchools: {
          include: { school: true },
        },
      },
    });

    if (!property) throw new NotFoundError("Property not found");

    // Increment views
    await prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    sendSuccess(res, { property: { ...property, views: property.views + 1 } });
  } catch (err) {
    next(err);
  }
}

export async function getPropertyBySlug(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const property = await prisma.property.findFirst({
      where: {
        OR: [
          { id: slug },
          { address: { contains: slug, mode: "insensitive" } },
        ],
      },
      include: {
        neighborhood: true,
        nearbySchools: { include: { school: true } },
      },
    });

    if (!property) throw new NotFoundError("Property not found");

    await prisma.property.update({
      where: { id: property.id },
      data: { views: { increment: 1 } },
    });

    sendSuccess(res, { property: { ...property, views: property.views + 1 } });
  } catch (err) {
    next(err);
  }
}

export async function incrementViews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const property = await prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { id: true, views: true },
    });

    sendSuccess(res, { views: property.views });
  } catch (err) {
    next(err);
  }
}

export async function getComparableProperties(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundError("Property not found");

    const comparable = await prisma.property.findMany({
      where: {
        id: { not: id },
        city: property.city,
        propertyType: property.propertyType,
        price: {
          gte: property.price * 0.7,
          lte: property.price * 1.3,
        },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, { comparableHomes: comparable });
  } catch (err) {
    next(err);
  }
}

export async function getPriceHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true, priceHistory: true, price: true },
    });

    if (!property) throw new NotFoundError("Property not found");

    sendSuccess(res, {
      priceHistory: property.priceHistory || [{ date: new Date().toISOString(), price: property.price }],
    });
  } catch (err) {
    next(err);
  }
}

export async function getZestimate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundError("Property not found");

    // Simple zestimate based on property price ± 5%
    const zestimate = property.zestimate || property.price;
    const range = {
      low: Math.round(zestimate * 0.95),
      high: Math.round(zestimate * 1.05),
    };

    sendSuccess(res, { zestimate, range });
  } catch (err) {
    next(err);
  }
}

export async function createProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const property = await prisma.property.create({ data: req.body });
    sendSuccess(res, { property }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const property = await prisma.property.update({
      where: { id },
      data: req.body,
    });
    sendSuccess(res, { property });
  } catch (err) {
    next(err);
  }
}

export async function deleteProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await prisma.property.delete({ where: { id } });
    sendSuccess(res, null, 200, "Property deleted successfully");
  } catch (err) {
    next(err);
  }
}
