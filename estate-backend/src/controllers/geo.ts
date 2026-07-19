import { Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import {
  haversineDistance,
  pointInPolygon,
  getBoundingBox,
  Point,
} from '../services/geo.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

interface Amenity {
  id: string;
  name: string;
  type: 'school' | 'neighborhood' | 'estate';
  lat: number;
  lng: number;
  distance?: number;
}

/**
 * Get nearby amenities (schools, neighborhoods, estates) within a radius.
 */
export async function getNearby(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // The `validate(NearbySchema, 'query')` middleware has already coerced
    // these to numbers and validated their ranges before this handler runs.
    const { lat, lng, radiusKm } = req.query as unknown as { lat: number; lng: number; radiusKm: number };

    const centerPoint: Point = { lat, lng };
    const radius = radiusKm;

    // Fetch schools
    const schools = await prisma.school.findMany({
      where: { lat: { not: null }, lng: { not: null } },
      select: { id: true, name: true, lat: true, lng: true },
    });

    // Fetch neighborhoods
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { lat: { not: null }, lng: { not: null } },
      select: { id: true, name: true, lat: true, lng: true },
    });

    // Fetch estates
    const estates = await prisma.estate.findMany({
      where: { lat: { not: null }, lng: { not: null } },
      select: { id: true, name: true, lat: true, lng: true },
    });

    // Combine and filter by radius
    const allAmenities: Amenity[] = [];

    schools.forEach(s => {
      if (s.lat && s.lng) {
        allAmenities.push({
          id: s.id,
          name: s.name,
          type: 'school',
          lat: s.lat,
          lng: s.lng,
        });
      }
    });

    neighborhoods.forEach(n => {
      if (n.lat && n.lng) {
        allAmenities.push({
          id: n.id,
          name: n.name,
          type: 'neighborhood',
          lat: n.lat,
          lng: n.lng,
        });
      }
    });

    estates.forEach(e => {
      if (e.lat && e.lng) {
        allAmenities.push({
          id: e.id,
          name: e.name,
          type: 'estate',
          lat: e.lat,
          lng: e.lng,
        });
      }
    });

    const nearby = allAmenities
      .map(amenity => ({
        ...amenity,
        distance: haversineDistance(centerPoint, { lat: amenity.lat, lng: amenity.lng }),
      }))
      .filter(amenity => amenity.distance <= radius)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    return sendSuccess(res, { amenities: nearby });
  } catch (error) {
    next(error);
  }
}

/**
 * Search properties by polygon bounds.
 */
export async function searchByBounds(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { polygon } = req.body;

    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return sendError(res, 400, 'BAD_REQUEST', 'Invalid polygon: must have at least 3 points');
    }

    // Validate polygon points
    for (const point of polygon) {
      if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
        return sendError(res, 400, 'BAD_REQUEST', 'Invalid polygon point structure');
      }
    }

    // Get bounding box and pre-filter (optimization)
    const bounds = getBoundingBox(polygon);
    const preFiltered = await prisma.property.findMany({
      where: {
        lat: { gte: bounds.minLat, lte: bounds.maxLat },
        lng: { gte: bounds.minLng, lte: bounds.maxLng },
        listingStatus: 'for_sale',
      },
    });

    // Fine-grained polygon filter
    const results = preFiltered.filter(property => {
      if (!property.lat || !property.lng) return false;
      return pointInPolygon(
        { lat: property.lat, lng: property.lng },
        polygon.map(p => ({ lat: p.lat, lng: p.lng })),
      );
    });

    return sendSuccess(res, { properties: results, count: results.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Calculate distance between two points.
 * Optionally uses Google Distance Matrix API for real commute time if server key is set.
 */
export async function getDistance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Already coerced/validated to numbers by `validate(DistanceSchema, 'query')`.
    const { fromLat, fromLng, toLat, toLng } = req.query as unknown as {
      fromLat: number;
      fromLng: number;
      toLat: number;
      toLng: number;
    };

    const from: Point = { lat: fromLat, lng: fromLng };
    const to: Point = { lat: toLat, lng: toLng };

    const straightLineDistance = haversineDistance(from, to);

    const result: any = {
      straightLineDistance,
      unit: 'km',
    };

    // TODO: Integrate Google Distance Matrix API if GOOGLE_MAPS_SERVER_KEY is set
    // For now, return straight-line estimate

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
