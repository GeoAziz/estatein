import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getMaintenanceRequests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, priority, tenantId, propertyId } = req.query as Record<string, string | undefined>;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (tenantId) where.tenantId = tenantId;
    if (propertyId) where.propertyId = propertyId;

    const [data, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
          property: { select: { id: true, address: true, city: true } },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

function canAccessMaintenanceRequest(
  request: { tenant: { userId: string; landlordId: string | null } | null },
  req: AuthRequest
): boolean {
  if (req.user!.role === "admin") return true;
  return request.tenant?.userId === req.user!.id || request.tenant?.landlordId === req.user!.id;
}

export async function getMaintenanceRequestById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        tenant: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        property: true,
      },
    });

    if (!request) throw new NotFoundError("Maintenance request not found");
    if (!canAccessMaintenanceRequest(request, req)) throw new AuthorizationError("Unauthorized");
    sendSuccess(res, { request });
  } catch (err) {
    next(err);
  }
}

export async function createMaintenanceRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { tenantId, propertyId, title, description, category, priority, photos } = req.body;

    const request = await prisma.maintenanceRequest.create({
      data: {
        tenantId,
        propertyId,
        title,
        description,
        category,
        priority: priority || "medium",
        photos: photos || [],
      },
      include: {
        tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
        property: { select: { id: true, address: true, city: true } },
      },
    });

    sendSuccess(res, { request }, 201, "Maintenance request created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateMaintenanceRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const existing = await prisma.maintenanceRequest.findUnique({ where: { id }, include: { tenant: true } });
    if (!existing) throw new NotFoundError("Maintenance request not found");
    if (!canAccessMaintenanceRequest(existing, req)) throw new AuthorizationError("Unauthorized");

    const { title, description, category, priority, status, photos } = req.body;
    const updateData: any = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(photos !== undefined && { photos }),
    };
    if (status === "resolved") updateData.resolvedAt = new Date();

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        tenant: { include: { user: { select: { id: true, name: true, email: true } } } },
        property: { select: { id: true, address: true, city: true } },
      },
    });

    sendSuccess(res, { request: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteMaintenanceRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const existing = await prisma.maintenanceRequest.findUnique({ where: { id }, include: { tenant: true } });
    if (!existing) throw new NotFoundError("Maintenance request not found");
    if (!canAccessMaintenanceRequest(existing, req)) throw new AuthorizationError("Unauthorized");

    await prisma.maintenanceRequest.delete({ where: { id } });
    sendSuccess(res, null, 200, "Maintenance request deleted successfully");
  } catch (err) {
    next(err);
  }
}
