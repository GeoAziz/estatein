import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getTenants(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, landlordId } = req.query as Record<string, string | undefined>;

    const where: any = {};
    if (status) where.status = status;
    if (landlordId) where.landlordId = landlordId;
    if (req.user!.role === "tenant") where.userId = req.user!.id;

    const [data, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          property: { select: { id: true, address: true, city: true, propertyType: true } },
          landlord: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getTenantById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        property: true,
        landlord: { select: { id: true, name: true, email: true, phone: true } },
        maintenanceRequests: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!tenant) throw new NotFoundError("Tenant not found");
    if (
      tenant.userId !== req.user!.id &&
      tenant.landlordId !== req.user!.id &&
      req.user!.role !== "admin"
    ) {
      throw new AuthorizationError("Unauthorized");
    }
    sendSuccess(res, { tenant });
  } catch (err) {
    next(err);
  }
}

export async function createTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId, propertyId, leaseStartDate, leaseEndDate, monthlyRent, currency, securityDeposit, paymentDay, notes } = req.body;

    const tenant = await prisma.tenant.create({
      data: {
        userId,
        propertyId,
        landlordId: req.user!.id,
        leaseStartDate: new Date(leaseStartDate),
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null,
        monthlyRent,
        currency: currency || "KSH",
        securityDeposit,
        paymentDay: paymentDay || 1,
        notes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, address: true, city: true } },
      },
    });

    sendSuccess(res, { tenant }, 201, "Tenant created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError("Tenant not found");
    if (tenant.landlordId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    const { leaseStartDate, leaseEndDate, monthlyRent, currency, securityDeposit, status, paymentDay, notes } = req.body;

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(leaseStartDate !== undefined && { leaseStartDate: new Date(leaseStartDate) }),
        ...(leaseEndDate !== undefined && { leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null }),
        ...(monthlyRent !== undefined && { monthlyRent }),
        ...(currency !== undefined && { currency }),
        ...(securityDeposit !== undefined && { securityDeposit }),
        ...(status !== undefined && { status }),
        ...(paymentDay !== undefined && { paymentDay }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, address: true, city: true } },
      },
    });

    sendSuccess(res, { tenant: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError("Tenant not found");
    if (tenant.landlordId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    await prisma.tenant.delete({ where: { id } });
    sendSuccess(res, null, 200, "Tenant removed successfully");
  } catch (err) {
    next(err);
  }
}
