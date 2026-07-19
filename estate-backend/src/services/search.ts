import prisma from "../config/database.js";
import type { Prisma } from "@prisma/client";
import { searchPropertiesES, type ESSearchFilters } from "./elasticsearch.js";
import { cacheGet, cacheSet, cacheKey } from "./cache.js";

export async function searchProperties(filters: {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  location?: string;
  listingStatus?: string;
  sortBy?: string;
  county?: string;
  estate?: string;
  furnished?: boolean;
  parking?: boolean;
  investmentProperty?: boolean;
  pool?: boolean;
  gym?: boolean;
  security?: boolean;
  internet?: boolean;
  petFriendly?: boolean;
  landSizeMin?: number;
  landSizeMax?: number;
  query?: string;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;

  // Build cache key from filters
  const cacheK = cacheKey("search", JSON.stringify(filters));

  // Try cache for simple queries (no text search)
  if (!filters.query) {
    const cached = await cacheGet<any>(cacheK);
    if (cached) return cached;
  }

  // Try Elasticsearch for text search or when available
  const searchQuery = filters.query || filters.location;
  if (searchQuery) {
    const esFilters: ESSearchFilters = {
      query: searchQuery,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      bedrooms: filters.bedrooms,
      bathrooms: filters.bathrooms,
      propertyType: filters.propertyType,
      listingStatus: filters.listingStatus,
      county: filters.county,
      estate: filters.estate,
      furnished: filters.furnished,
      parking: filters.parking,
      pool: filters.pool,
      gym: filters.gym,
      security: filters.security,
      internet: filters.internet,
      petFriendly: filters.petFriendly,
      investmentProperty: filters.investmentProperty,
      landSizeMin: filters.landSizeMin,
      landSizeMax: filters.landSizeMax,
      sortBy: filters.sortBy,
      page,
      limit,
    };

    const esResult = await searchPropertiesES(esFilters);
    if (esResult) return esResult;
  }

  // Fallback to Prisma (PostgreSQL)
  const skip = (page - 1) * limit;

  const where: Prisma.PropertyWhereInput = {
    ...(filters.listingStatus && { listingStatus: filters.listingStatus as any }),
    ...(filters.minPrice && { price: { gte: filters.minPrice } }),
    ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
    ...(filters.minPrice && filters.maxPrice && { price: { gte: filters.minPrice, lte: filters.maxPrice } }),
    ...(filters.bedrooms && { beds: { gte: filters.bedrooms } }),
    ...(filters.bathrooms && { baths: { gte: filters.bathrooms } }),
    ...(filters.propertyType && { propertyType: filters.propertyType as any }),
    ...(filters.location && {
      OR: [
        { city: { contains: filters.location, mode: "insensitive" } },
        { address: { contains: filters.location, mode: "insensitive" } },
        { state: { contains: filters.location, mode: "insensitive" } },
        { county: { contains: filters.location, mode: "insensitive" } },
        { estate: { contains: filters.location, mode: "insensitive" } },
      ],
    }),
    ...(filters.county && { county: { contains: filters.county, mode: "insensitive" } }),
    ...(filters.estate && { estate: { contains: filters.estate, mode: "insensitive" } }),
    ...(filters.furnished !== undefined && { furnished: filters.furnished }),
    ...(filters.parking !== undefined && { parking: filters.parking }),
    ...(filters.investmentProperty !== undefined && { investmentProperty: filters.investmentProperty }),
    ...(filters.pool !== undefined && { pool: filters.pool }),
    ...(filters.gym !== undefined && { gym: filters.gym }),
    ...(filters.security !== undefined && { security: filters.security }),
    ...(filters.internet !== undefined && { internet: filters.internet }),
    ...(filters.petFriendly !== undefined && { petFriendly: filters.petFriendly }),
    ...(filters.landSizeMin && { landSize: { gte: filters.landSizeMin } }),
    ...(filters.landSizeMax && { landSize: { lte: filters.landSizeMax } }),
    ...(filters.landSizeMin && filters.landSizeMax && { landSize: { gte: filters.landSizeMin, lte: filters.landSizeMax } }),
  };

  const orderBy: Prisma.PropertyOrderByWithRelationInput = (() => {
    switch (filters.sortBy) {
      case "price":
        return { price: "asc" };
      case "views":
        return { views: "desc" };
      default:
        return { createdAt: "desc" };
    }
  })();

  const [data, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        neighborhood: {
          select: { id: true, name: true, city: true },
        },
      },
    }),
    prisma.property.count({ where }),
  ]);

  const result = {
    data,
    total,
    pages: Math.ceil(total / limit),
    page,
    limit,
  };

  // Cache non-text search results for 5 minutes
  if (!filters.query) {
    await cacheSet(cacheK, result, 300);
  }

  return result;
}
