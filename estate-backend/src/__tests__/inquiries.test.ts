import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));

const { default: app } = await import("../app.js");

beforeEach(() => {
  resetPrismaMock();
});

describe("POST /api/inquiries", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/inquiries").send({
      propertyId: "prop_1",
      message: "Is this property still available for viewing?",
      contactMethod: "email",
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("NOT_AUTHENTICATED");
  });
});

describe("GET /api/inquiries", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/inquiries");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/inquiries (authenticated)", () => {
  it("creates an inquiry for a signed-in buyer", async () => {
    const { generateAccessToken } = await import("../utils/jwt.js");
    const token = generateAccessToken("buyer_1", "buyer@example.com", "buyer");

    prismaMock.inquiry.create.mockResolvedValue({ id: "inq_1", propertyId: "prop_1" });
    prismaMock.property.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/inquiries")
      .set("Cookie", [`accessToken=${token}`])
      .send({
        propertyId: "prop_1",
        message: "Is this property still available for viewing?",
        contactMethod: "email",
      });

    expect(res.status).toBe(201);
    expect(prismaMock.inquiry.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.property.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "prop_1" } })
    );
  });
});
