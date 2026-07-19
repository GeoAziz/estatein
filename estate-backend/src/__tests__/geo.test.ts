import { describe, it, expect } from "vitest";
import { haversineDistance, pointInPolygon, getBoundingBox, filterByRadius, filterByBounds } from "../services/geo.js";

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    const p = { lat: -1.2921, lng: 36.8219 };
    expect(haversineDistance(p, p)).toBeCloseTo(0, 5);
  });

  it("computes a known distance between Nairobi and Mombasa (~440km)", () => {
    const nairobi = { lat: -1.2921, lng: 36.8219 };
    const mombasa = { lat: -4.0435, lng: 39.6682 };
    const distance = haversineDistance(nairobi, mombasa);
    expect(distance).toBeGreaterThan(400);
    expect(distance).toBeLessThan(500);
  });

  it("is symmetric", () => {
    const a = { lat: -1.2921, lng: 36.8219 };
    const b = { lat: -1.3, lng: 36.8 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 10);
  });
});

describe("pointInPolygon", () => {
  const square = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 10 },
    { lat: 10, lng: 10 },
    { lat: 10, lng: 0 },
  ];

  it("returns true for a point inside the polygon", () => {
    expect(pointInPolygon({ lat: 5, lng: 5 }, square)).toBe(true);
  });

  it("returns false for a point outside the polygon", () => {
    expect(pointInPolygon({ lat: 20, lng: 20 }, square)).toBe(false);
  });

  it("returns false for fewer than 3 polygon points", () => {
    expect(pointInPolygon({ lat: 5, lng: 5 }, [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }])).toBe(false);
  });
});

describe("getBoundingBox", () => {
  it("computes min/max lat/lng across points", () => {
    const points = [
      { lat: 0, lng: 0 },
      { lat: 10, lng: -5 },
      { lat: -3, lng: 8 },
    ];
    expect(getBoundingBox(points)).toEqual({ minLat: -3, maxLat: 10, minLng: -5, maxLng: 8 });
  });

  it("returns zeros for an empty array", () => {
    expect(getBoundingBox([])).toEqual({ minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 });
  });
});

describe("filterByRadius", () => {
  it("keeps only points within the radius", () => {
    const center = { lat: 0, lng: 0 };
    const points = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 10, lng: 10 },
    ];
    const result = filterByRadius(points, center, 200);
    expect(result).toHaveLength(2);
  });
});

describe("filterByBounds", () => {
  it("keeps only points within the bounding box", () => {
    const points = [
      { lat: 5, lng: 5 },
      { lat: 20, lng: 20 },
    ];
    const result = filterByBounds(points, 0, 10, 0, 10);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ lat: 5, lng: 5 });
  });
});
