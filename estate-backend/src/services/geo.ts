/**
 * Geospatial utilities for property location-based search and distance calculations.
 * Uses Haversine formula for great-circle distance and ray-casting for polygon containment.
 */

const EARTH_RADIUS_KM = 6371;

export interface Point {
  lat: number;
  lng: number;
}

/**
 * Calculate great-circle distance between two points using Haversine formula.
 * @param from Starting point
 * @param to Destination point
 * @returns Distance in kilometers
 */
export function haversineDistance(from: Point, to: Point): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Convert degrees to radians.
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm.
 * @param point Point to test
 * @param polygon Array of points forming the polygon (must be closed: first point == last point)
 * @returns true if point is inside the polygon
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];

    const xi = pi.lng;
    const yi = pi.lat;
    const xj = pj.lng;
    const yj = pj.lat;

    const intersect = (yi > point.lat) !== (yj > point.lat) &&
      point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Get bounding box for a set of points.
 * @param points Array of points
 * @returns Object with min/max lat/lng
 */
export function getBoundingBox(points: Point[]) {
  if (points.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }

  return {
    minLat: Math.min(...points.map(p => p.lat)),
    maxLat: Math.max(...points.map(p => p.lat)),
    minLng: Math.min(...points.map(p => p.lng)),
    maxLng: Math.max(...points.map(p => p.lng)),
  };
}

/**
 * Filter points within a radius of a center point.
 * @param points Points to filter
 * @param center Center point
 * @param radiusKm Radius in kilometers
 * @returns Points within the radius
 */
export function filterByRadius<T extends Point>(
  points: T[],
  center: Point,
  radiusKm: number,
): T[] {
  return points.filter(point => haversineDistance(center, point) <= radiusKm);
}

/**
 * Filter points within a bounding box.
 * @param points Points to filter
 * @param minLat Minimum latitude
 * @param maxLat Maximum latitude
 * @param minLng Minimum longitude
 * @param maxLng Maximum longitude
 * @returns Points within the bounds
 */
export function filterByBounds<T extends Point>(
  points: T[],
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
): T[] {
  return points.filter(
    p => p.lat >= minLat && p.lat <= maxLat && p.lng >= minLng && p.lng <= maxLng,
  );
}
