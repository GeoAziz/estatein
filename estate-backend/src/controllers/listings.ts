import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthorizationError } from "../utils/errors.js";
import { sendSuccess, sendPaginated } from "../utils/response.js";
import { trackEvent } from "../services/telemetry.js";

export async function getListings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const userId = req.query.userId as string | undefined;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          property: true,
        },
      }),
      prisma.listing.count({ where }),
    ]);

    sendPaginated(res, data, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function getListingById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        property: {
          include: {
            neighborhood: true,
            nearbySchools: { include: { school: true } },
          },
        },
      },
    });

    if (!listing) throw new NotFoundError("Listing not found");
    sendSuccess(res, { listing });
  } catch (err) {
    next(err);
  }
}

export async function createListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { propertyId, property, title, description, listingType, price } = req.body;

    let finalPropertyId = propertyId;

    // If no propertyId provided, create a new property
    if (!propertyId && property) {
      const newProperty = await prisma.property.create({
        data: {
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zipCode,
          propertyType: property.propertyType,
          beds: property.beds,
          baths: property.baths,
          sqFt: property.sqFt,
          price: property.price,
          description: property.description,
          features: property.features || [],
          amenities: property.amenities || [],
          photos: property.photos || [],
          listingStatus: "pending",
        },
      });
      finalPropertyId = newProperty.id;
    }

    const listing = await prisma.listing.create({
      data: {
        userId: req.user!.id,
        propertyId: finalPropertyId,
        title,
        description,
        listingType,
        price,
        status: "pending",
      },
      include: {
        property: true,
      },
    });

    trackEvent("listing_created", req.user!.id, { listingId: listing.id }).catch(() => {});
    sendSuccess(res, { listing }, 201, "Listing created successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("You can only update your own listings");
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: req.body,
      include: { property: true },
    });

    sendSuccess(res, { listing: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("You can only delete your own listings");
    }

    await prisma.listing.delete({ where: { id } });
    sendSuccess(res, null, 200, "Listing deleted successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateListingStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status },
      include: { property: true },
    });

    sendSuccess(res, { listing: updated });
  } catch (err) {
    next(err);
  }
}

export async function getListingAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundError("Listing not found");
    if (listing.userId !== req.user!.id && req.user!.role !== "admin") {
      throw new AuthorizationError("Unauthorized");
    }

    sendSuccess(res, {
      views: listing.views,
      favorites: listing.favorites,
      inquiries: listing.inquiries,
      createdAt: listing.createdAt,
    });
  } catch (err) {
    next(err);
  }
}
