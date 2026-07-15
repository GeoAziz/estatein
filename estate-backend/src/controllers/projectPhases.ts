import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export async function getPhasesByProject(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projectId = String(req.params.projectId);
    const project = await prisma.developerProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError("Developer project not found");

    const phases = await prisma.projectPhase.findMany({
      where: { projectId },
      include: { units: true },
      orderBy: { phaseNumber: "asc" },
    });

    sendSuccess(res, { phases });
  } catch (err) {
    next(err);
  }
}

export async function getPhaseById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const phase = await prisma.projectPhase.findUnique({
      where: { id },
      include: {
        units: { orderBy: { unitNumber: "asc" } },
        project: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!phase) throw new NotFoundError("Project phase not found");
    sendSuccess(res, { phase });
  } catch (err) {
    next(err);
  }
}

export async function createPhase(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const projectId = String(req.params.projectId);
    const project = await prisma.developerProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError("Developer project not found");
    if (project.developerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    const { name, description, phaseNumber, totalUnits, startingPrice, status, launchDate, completionDate } = req.body;

    const phase = await prisma.projectPhase.create({
      data: {
        projectId,
        name,
        description,
        phaseNumber,
        totalUnits: totalUnits || 0,
        availableUnits: totalUnits || 0,
        startingPrice,
        status: status || "planning",
        launchDate: launchDate ? new Date(launchDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,
      },
      include: { units: true },
    });

    sendSuccess(res, { phase }, 201, "Phase created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updatePhase(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const phase = await prisma.projectPhase.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!phase) throw new NotFoundError("Project phase not found");
    if (phase.project.developerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    const updated = await prisma.projectPhase.update({
      where: { id },
      data: req.body,
      include: { units: true },
    });

    sendSuccess(res, { phase: updated });
  } catch (err) {
    next(err);
  }
}

export async function deletePhase(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const phase = await prisma.projectPhase.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!phase) throw new NotFoundError("Project phase not found");
    if (phase.project.developerId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    await prisma.projectPhase.delete({ where: { id } });
    sendSuccess(res, null, 200, "Phase deleted successfully");
  } catch (err) {
    next(err);
  }
}
