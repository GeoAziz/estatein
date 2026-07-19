import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));

const smsSend = vi.fn().mockResolvedValue({ messageId: "msg_1", status: "sent" });
vi.mock("../services/sms.js", () => ({
  createSmsProvider: () => ({ send: smsSend }),
  SMS_TEMPLATES: {
    VERIFICATION_CODE: (code: string) => `Your code is ${code}`,
    VIEWING_REMINDER: (address: string, time: string) => `Viewing at ${address} on ${time}`,
  },
}));

const { default: app } = await import("../app.js");
const { generateAccessToken } = await import("../utils/jwt.js");

beforeEach(() => {
  resetPrismaMock();
  smsSend.mockClear();
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

describe("PUT /api/inquiries/:id/viewing-status", () => {
  it("sends a confirmation SMS and notification when a viewing is confirmed", async () => {
    const token = generateAccessToken("agent_1", "agent@example.com", "agent");
    prismaMock.inquiry.findUnique.mockResolvedValue({
      id: "inq_1",
      buyerId: "buyer_1",
      sellerId: null,
      agentId: "agent_1",
      viewingDate: new Date("2026-08-01"),
      viewingTime: "2:00 PM",
      buyer: { phone: "0712345678", name: "Buyer" },
      property: { address: "123 Riverside", city: "Nairobi" },
    });
    prismaMock.inquiry.update.mockResolvedValue({ id: "inq_1", viewingStatus: "confirmed" });
    prismaMock.notification.create.mockResolvedValue({});

    const res = await request(app)
      .put("/api/inquiries/inq_1/viewing-status")
      .set("Cookie", [`accessToken=${token}`])
      .send({ viewingStatus: "confirmed" });

    expect(res.status).toBe(200);
    expect(smsSend).toHaveBeenCalledWith("0712345678", expect.stringContaining("123 Riverside"));
    expect(prismaMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "buyer_1", type: "viewing" }) })
    );
  });

  it("blocks a participant who isn't the buyer, seller, or agent on this inquiry", async () => {
    const token = generateAccessToken("stranger_1", "stranger@example.com", "buyer");
    prismaMock.inquiry.findUnique.mockResolvedValue({
      id: "inq_1",
      buyerId: "buyer_1",
      sellerId: null,
      agentId: "agent_1",
    });

    const res = await request(app)
      .put("/api/inquiries/inq_1/viewing-status")
      .set("Cookie", [`accessToken=${token}`])
      .send({ viewingStatus: "confirmed" });

    expect(res.status).toBe(403);
  });
});

describe("PUT /api/inquiries/:id/viewing-schedule", () => {
  it("reschedules and resets status to requested pending re-confirmation", async () => {
    const token = generateAccessToken("agent_1", "agent@example.com", "agent");
    prismaMock.inquiry.findUnique.mockResolvedValue({
      id: "inq_1",
      buyerId: "buyer_1",
      sellerId: null,
      agentId: "agent_1",
      viewingRequested: true,
      viewingDate: new Date("2026-08-01"),
      viewingTime: "2:00 PM",
    });
    prismaMock.inquiry.update.mockResolvedValue({
      id: "inq_1",
      viewingDate: new Date("2026-08-05"),
      viewingTime: "4:00 PM",
      viewingStatus: "requested",
    });
    prismaMock.notification.create.mockResolvedValue({});

    const res = await request(app)
      .put("/api/inquiries/inq_1/viewing-schedule")
      .set("Cookie", [`accessToken=${token}`])
      .send({ viewingDate: "2026-08-05", viewingTime: "4:00 PM" });

    expect(res.status).toBe(200);
    expect(prismaMock.inquiry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inq_1" },
        data: expect.objectContaining({ viewingTime: "4:00 PM", viewingStatus: "requested" }),
      })
    );
  });

  it("rejects rescheduling an inquiry that never requested a viewing", async () => {
    const token = generateAccessToken("agent_1", "agent@example.com", "agent");
    prismaMock.inquiry.findUnique.mockResolvedValue({
      id: "inq_2",
      buyerId: "buyer_1",
      sellerId: null,
      agentId: "agent_1",
      viewingRequested: false,
    });

    const res = await request(app)
      .put("/api/inquiries/inq_2/viewing-schedule")
      .set("Cookie", [`accessToken=${token}`])
      .send({ viewingDate: "2026-08-05", viewingTime: "4:00 PM" });

    expect(res.status).toBe(403);
  });
});
