import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));

const { default: app } = await import("../app.js");

beforeEach(() => {
  resetPrismaMock();
});

describe("GET /api/properties", () => {
  it("lists properties without requiring auth", async () => {
    prismaMock.property.findMany.mockResolvedValue([
      { id: "prop_1", address: "123 Main St", city: "Nairobi", price: 5_000_000 },
    ]);
    prismaMock.property.count.mockResolvedValue(1);

    const res = await request(app).get("/api/properties?limit=20&page=1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it("rejects an out-of-range limit with a validation error", async () => {
    const res = await request(app).get("/api/properties?limit=500");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/properties", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/properties").send({ address: "1 Main St", city: "Nairobi" });
    expect(res.status).toBe(401);
  });
});
