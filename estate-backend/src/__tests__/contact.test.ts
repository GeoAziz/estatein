import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));
vi.mock("../services/email.js", () => ({
  sendContactMessageNotification: vi.fn().mockResolvedValue(undefined),
}));

const { default: app } = await import("../app.js");

beforeEach(() => {
  resetPrismaMock();
});

describe("POST /api/contact", () => {
  it("accepts a valid contact message with no auth required", async () => {
    prismaMock.contactMessage.create.mockResolvedValue({ id: "msg_1" });

    const res = await request(app).post("/api/contact").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      message: "I'm looking for a 3-bedroom house in Nairobi under 20M KSh.",
      source: "contact-page",
    });

    expect(res.status).toBe(201);
    expect(prismaMock.contactMessage.create).toHaveBeenCalledTimes(1);
  });

  it("rejects a message that's too short", async () => {
    const res = await request(app).post("/api/contact").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      message: "too short",
      source: "contact-page",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an invalid email", async () => {
    const res = await request(app).post("/api/contact").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "not-an-email",
      message: "I'm looking for a 3-bedroom house in Nairobi under 20M KSh.",
      source: "contact-page",
    });

    expect(res.status).toBe(400);
  });
});
