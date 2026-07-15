import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export async function getSystemSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { category } = req.query as { category?: string };
    const where: any = {};
    if (category) where.category = category;

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: { key: "asc" },
    });

    sendSuccess(res, { settings });
  } catch (err) {
    next(err);
  }
}

export async function getSystemSettingByKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const key = String(req.params.key);
    const setting = await prisma.systemSetting.findUnique({ where: { key } });

    if (!setting) throw new NotFoundError("System setting not found");
    sendSuccess(res, { setting });
  } catch (err) {
    next(err);
  }
}

export async function createSystemSetting(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== "admin") throw new AuthorizationError("Admin only");

    const { key, value, category } = req.body;
    const setting = await prisma.systemSetting.create({
      data: { key, value, category },
    });

    sendSuccess(res, { setting }, 201, "System setting created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateSystemSetting(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== "admin") throw new AuthorizationError("Admin only");

    const key = String(req.params.key);
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) throw new NotFoundError("System setting not found");

    const updated = await prisma.systemSetting.update({
      where: { key },
      data: { value: req.body.value, category: req.body.category },
    });

    sendSuccess(res, { setting: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteSystemSetting(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== "admin") throw new AuthorizationError("Admin only");

    const key = String(req.params.key);
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) throw new NotFoundError("System setting not found");

    await prisma.systemSetting.delete({ where: { key } });
    sendSuccess(res, null, 200, "System setting deleted successfully");
  } catch (err) {
    next(err);
  }
}

export async function getSystemSettingsBulk(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { keys } = req.body;
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } },
    });

    const result = settings.reduce((acc: Record<string, any>, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    sendSuccess(res, { settings: result });
  } catch (err) {
    next(err);
  }
}
