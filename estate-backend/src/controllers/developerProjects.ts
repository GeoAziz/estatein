import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getDeveloperProjects(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, city, developerId } = req.query as Record<string, string | undefined>;

    const where: any = {};
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (developerId) where.developerId = developerId;

    const [data, total] = await Promise.all([
      prisma.developerProject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          developer: { select: { id: true, name: true, email: true, phone: true } },
          phases: true,
        },
      }),
      prisma.developerProject.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getDeveloperProjectById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const project = await prisma.developerProject.findUnique({
      where: { id },
      include: {
        developer: { select: { id: true, name: true, email: true, phone: true } },
        phases: {
          include: { units: true },
          orderBy: { phaseNumber: "asc" },
        },
      },
    });

    if (!project) throw new NotFoundError("Developer project not found");
    sendSuccess(res, { project });
  } catch (err) {
    next(err);
  }
}

export async function getDeveloperProjectBySlug(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const project = await prisma.developerProject.findUnique({
      where: { slug },
      include: {
        developer: { select: { id: true, name: true, email: true, phone: true } },
        phases: {
          include: { units: true },
          orderBy: { phaseNumber: "asc" },
        },
      },
    });

    if (!project) throw new NotFoundError("Developer project not found");
    sendSuccess(res, { project });
  } catch (err) {
    next(err);
  }
}

export async function createDeveloperProject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, description, location, city, county, totalUnits, startingPrice, currency, photos, features, amenities, launchDate, completionDate } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const project = await prisma.developerProject.create({
      data: {
        developerId: req.user!.id,
        name,
        slug,
        description,
        location,
        city,
        county,
        totalUnits: totalUnits || 0,
        availableUnits: totalUnits || 0,
        startingPrice,
        currency: currency || "KSH",
        photos: photos || [],
        features: features || [],
        amenities: amenities || [],
        launchDate: launchDate ? new Date(launchDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,
      },
      include: {
        developer: { select: { id: true, name: true, email: true } },
      },
    });

    sendSuccess(res, { project }, 201, "Developer project created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateDeveloperProject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const project = await prisma.developerProject.findUnique({ where: { id } });
    if (!project) throw new NotFoundError("Developer project not found");
    if (project.developerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("You can only update your own projects");
    }

    const updated = await prisma.developerProject.update({
      where: { id },
      data: req.body,
      include: {
        developer: { select: { id: true, name: true, email: true } },
        phases: true,
      },
    });

    sendSuccess(res, { project: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteDeveloperProject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const project = await prisma.developerProject.findUnique({ where: { id } });
    if (!project) throw new NotFoundError("Developer project not found");
    if (project.developerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("You can only delete your own projects");
    }

    await prisma.developerProject.delete({ where: { id } });
    sendSuccess(res, null, 200, "Developer project deleted successfully");
  } catch (err) {
    next(err);
  }
}
