import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";

export async function getMortgageApplications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query as Record<string, string | undefined>;

    const where: any = {};
    if (status) where.status = status;
    if (req.user!.role !== "admin") where.userId = req.user!.id;

    const [data, total] = await Promise.all([
      prisma.mortgageApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
          property: { select: { id: true, address: true, city: true } },
        },
      }),
      prisma.mortgageApplication.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getMortgageApplicationById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const application = await prisma.mortgageApplication.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        project: true,
        property: true,
      },
    });

    if (!application) throw new NotFoundError("Mortgage application not found");
    if (application.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    sendSuccess(res, { application });
  } catch (err) {
    next(err);
  }
}

export async function createMortgageApplication(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      projectId, propertyId, firstName, lastName, email, phone,
      monthlyIncome, employmentType, loanAmount, downPayment,
      loanTermYears, propertyValue, notes,
    } = req.body;

    const application = await prisma.mortgageApplication.create({
      data: {
        userId: req.user!.id,
        projectId,
        propertyId,
        firstName,
        lastName,
        email,
        phone,
        monthlyIncome,
        employmentType,
        loanAmount,
        downPayment,
        loanTermYears,
        propertyValue,
        notes,
      },
      include: {
        project: { select: { id: true, name: true } },
        property: { select: { id: true, address: true, city: true } },
      },
    });

    sendSuccess(res, { application }, 201, "Mortgage application created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateMortgageApplication(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const application = await prisma.mortgageApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundError("Mortgage application not found");
    if (application.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    const {
      firstName, lastName, email, phone,
      monthlyIncome, employmentType, loanAmount, downPayment,
      loanTermYears, propertyValue, notes,
    } = req.body;

    const updated = await prisma.mortgageApplication.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(monthlyIncome !== undefined && { monthlyIncome }),
        ...(employmentType !== undefined && { employmentType }),
        ...(loanAmount !== undefined && { loanAmount }),
        ...(downPayment !== undefined && { downPayment }),
        ...(loanTermYears !== undefined && { loanTermYears }),
        ...(propertyValue !== undefined && { propertyValue }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        project: { select: { id: true, name: true } },
        property: { select: { id: true, address: true, city: true } },
      },
    });

    sendSuccess(res, { application: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteMortgageApplication(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const application = await prisma.mortgageApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundError("Mortgage application not found");
    if (application.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    await prisma.mortgageApplication.delete({ where: { id } });
    sendSuccess(res, null, 200, "Mortgage application deleted successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateMortgageStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== "admin") throw new AuthorizationError("Admin only");

    const id = String(req.params.id);
    const application = await prisma.mortgageApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundError("Mortgage application not found");

    const { status, notes } = req.body;
    const updated = await prisma.mortgageApplication.update({
      where: { id },
      data: { status, notes: notes || application.notes },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        property: { select: { id: true, address: true, city: true } },
      },
    });

    sendSuccess(res, { application: updated });
  } catch (err) {
    next(err);
  }
}
