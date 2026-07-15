import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export async function getSavedSearches(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, { data: searches });
  } catch (err) {
    next(err);
  }
}

export async function createSavedSearch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const search = await prisma.savedSearch.create({
      data: {
        userId: req.user!.id,
        ...req.body,
      },
    });

    sendSuccess(res, { savedSearch: search }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateSavedSearch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const existing = await prisma.savedSearch.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Saved search not found");
    if (existing.userId !== req.user!.id) throw new AuthorizationError("Unauthorized");

    const updated = await prisma.savedSearch.update({
      where: { id },
      data: req.body,
    });

    sendSuccess(res, { savedSearch: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteSavedSearch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const existing = await prisma.savedSearch.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Saved search not found");
    if (existing.userId !== req.user!.id) throw new AuthorizationError("Unauthorized");

    await prisma.savedSearch.delete({ where: { id } });
    sendSuccess(res, null, 200, "Saved search deleted");
  } catch (err) {
    next(err);
  }
}

export async function triggerAlert(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const search = await prisma.savedSearch.findUnique({ where: { id } });
    if (!search) throw new NotFoundError("Saved search not found");
    if (search.userId !== req.user!.id) throw new AuthorizationError("Unauthorized");

    // Update lastSearched
    await prisma.savedSearch.update({
      where: { id },
      data: { lastSearched: new Date() },
    });

    // Count new listings since last alert
    const filters = search.filters as any;
    const newListingsCount = await prisma.listing.count({
      where: {
        status: "active",
        ...(search.lastSearched && { createdAt: { gte: search.lastSearched } }),
      },
    });

    sendSuccess(res, { success: true, newListingsCount });
  } catch (err) {
    next(err);
  }
}
