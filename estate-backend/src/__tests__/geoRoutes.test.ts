import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));

const { default: app } = await import("../app.js");

beforeEach(() => {
  resetPrismaMock();
});

describe("GET /api/geo/nearby", () => {
  it("requires lat/lng query parameters", async () => {
    const res = await request(app).get("/api/geo/nearby");
    expect(res.status).toBe(400);
  });

  it("returns amenities sorted by distance within the radius", async () => {
    prismaMock.school.findMany.mockResolvedValue([
      { id: "school_1", name: "Near School", lat: -1.2921, lng: 36.8219 },
      { id: "school_2", name: "Far School", lat: -4.0435, lng: 39.6682 },
    ]);
    prismaMock.neighborhood.findMany.mockResolvedValue([]);
    prismaMock.estate.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/geo/nearby?lat=-1.2921&lng=36.8219&radiusKm=5");

    expect(res.status).toBe(200);
    expect(res.body.data.amenities).toHaveLength(1);
    expect(res.body.data.amenities[0].name).toBe("Near School");
  });
});

describe("POST /api/geo/search-bounds", () => {
  it("rejects a polygon with fewer than 3 points", async () => {
    const res = await request(app).post("/api/geo/search-bounds").send({ polygon: [{ lat: 0, lng: 0 }] });
    expect(res.status).toBe(400);
  });

  it("returns properties whose coordinates fall inside the polygon", async () => {
    prismaMock.property.findMany.mockResolvedValue([
      { id: "prop_1", lat: 5, lng: 5 },
      { id: "prop_2", lat: 50, lng: 50 },
    ]);

    const polygon = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 10, lng: 10 },
      { lat: 10, lng: 0 },
    ];

    const res = await request(app).post("/api/geo/search-bounds").send({ polygon });

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.properties[0].id).toBe("prop_1");
  });
});

describe("GET /api/geo/distance", () => {
  it("requires all four coordinate parameters", async () => {
    const res = await request(app).get("/api/geo/distance?fromLat=0&fromLng=0");
    expect(res.status).toBe(400);
  });

  it("returns a straight-line distance estimate", async () => {
    const res = await request(app).get(
      "/api/geo/distance?fromLat=-1.2921&fromLng=36.8219&toLat=-4.0435&toLng=39.6682"
    );

    expect(res.status).toBe(200);
    expect(res.body.data.straightLineDistance).toBeGreaterThan(400);
    expect(res.body.data.unit).toBe("km");
  });
});
