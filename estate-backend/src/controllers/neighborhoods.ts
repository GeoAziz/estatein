import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getNeighborhoods(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.city) where.city = { contains: req.query.city as string, mode: "insensitive" };
    if (req.query.state) where.state = { contains: req.query.state as string, mode: "insensitive" };

    const [data, total] = await Promise.all([
      prisma.neighborhood.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.neighborhood.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getNeighborhoodById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id },
      include: {
        properties: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!neighborhood) throw new NotFoundError("Neighborhood not found");
    sendSuccess(res, { neighborhood });
  } catch (err) {
    next(err);
  }
}

export async function getDemographics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const neighborhood = await prisma.neighborhood.findUnique({ where: { id } });
    if (!neighborhood) throw new NotFoundError("Neighborhood not found");

    sendSuccess(res, {
      population: neighborhood.population,
      medianHomeValue: neighborhood.medianHomeValue,
      medianRent: neighborhood.medianRent,
      walkabilityScore: neighborhood.walkabilityScore,
      transitScore: neighborhood.transitScore,
      crimeRate: neighborhood.crimeRate,
    });
  } catch (err) {
    next(err);
  }
}

export async function getNeighborhoodSchools(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);

    const propertySchools = await prisma.propertyNearbySchool.findMany({
      where: {
        property: { neighborhoodId: id },
      },
      include: { school: true },
      distinct: ["schoolId"],
    });

    const schools = propertySchools.map((ps) => ps.school);
    sendSuccess(res, { schools });
  } catch (err) {
    next(err);
  }
}
