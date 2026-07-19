import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { sendSuccess } from "../utils/response.js";
import { computeMarketTrends } from "../services/valuation.js";

export async function getTrends(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const location = String(req.params.location);
    const trends = await computeMarketTrends(location);
    sendSuccess(res, trends);
  } catch (err) {
    next(err);
  }
}

export async function getSoldData(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const location = String(req.params.location);

    const soldProperties = await prisma.property.findMany({
      where: {
        listingStatus: "sold",
        OR: [
          { city: { contains: location, mode: "insensitive" } },
          { state: { contains: location, mode: "insensitive" } },
          { county: { contains: location, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    sendSuccess(res, {
      data: soldProperties.map((p) => ({
        soldPrice: p.price,
        soldDate: p.updatedAt,
        pricePerSqFt: p.sqFt ? Math.round(p.price / p.sqFt) : null,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getInventory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const location = String(req.params.location);

    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { city: { contains: location, mode: "insensitive" } },
          { state: { contains: location, mode: "insensitive" } },
          { county: { contains: location, mode: "insensitive" } },
        ],
      },
    });

    const byType: Record<string, number> = {};
    const byPrice: Record<string, number> = {};

    for (const p of properties) {
      byType[p.propertyType] = (byType[p.propertyType] || 0) + 1;
      const bracket =
        p.price < 3000000
          ? "Under KSh 3M"
          : p.price < 10000000
            ? "KSh 3M-10M"
            : p.price < 30000000
              ? "KSh 10M-30M"
              : "Over KSh 30M";
      byPrice[bracket] = (byPrice[bracket] || 0) + 1;
    }

    sendSuccess(res, { count: properties.length, byType, byPrice });
  } catch (err) {
    next(err);
  }
}

export async function getDaysOnMarket(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const location = String(req.params.location);

    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { city: { contains: location, mode: "insensitive" } },
          { state: { contains: location, mode: "insensitive" } },
          { county: { contains: location, mode: "insensitive" } },
        ],
        daysOnMarket: { not: null },
      },
    });

    const byType: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    for (const p of properties) {
      byType[p.propertyType] = (byType[p.propertyType] || 0) + (p.daysOnMarket || 0);
      typeCounts[p.propertyType] = (typeCounts[p.propertyType] || 0) + 1;
    }

    const averageByType: Record<string, number> = {};
    for (const [type, total] of Object.entries(byType)) {
      averageByType[type] = Math.round(total / typeCounts[type]);
    }

    const average =
      properties.length > 0
        ? Math.round(properties.reduce((sum, p) => sum + (p.daysOnMarket || 0), 0) / properties.length)
        : 0;

    sendSuccess(res, { average, byType: averageByType });
  } catch (err) {
    next(err);
  }
}
