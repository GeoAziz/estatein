import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));

const { default: app } = await import("../app.js");
const { generateAccessToken } = await import("../utils/jwt.js");

beforeEach(() => {
  resetPrismaMock();
});

describe("POST /api/availability", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/availability").send({
      slots: [{ date: new Date().toISOString(), startTime: "09:00", endTime: "10:00" }],
    });
    expect(res.status).toBe(401);
  });

  it("rejects non-agent users", async () => {
    const token = generateAccessToken("user_1", "buyer@example.com", "buyer");
    prismaMock.agent.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/availability")
      .set("Cookie", [`accessToken=${token}`])
      .send({ slots: [{ date: new Date().toISOString(), startTime: "09:00", endTime: "10:00" }] });

    expect(res.status).toBe(403);
  });

  it("creates slots for a verified agent", async () => {
    const token = generateAccessToken("user_1", "agent@example.com", "agent");
    prismaMock.agent.findUnique.mockResolvedValue({ id: "agent_1", userId: "user_1" });
    prismaMock.agentAvailabilitySlot.create.mockResolvedValue({
      id: "slot_1",
      agentId: "agent_1",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      isBooked: false,
    });

    const res = await request(app)
      .post("/api/availability")
      .set("Cookie", [`accessToken=${token}`])
      .send({ slots: [{ date: new Date().toISOString(), startTime: "09:00", endTime: "10:00" }] });

    expect(res.status).toBe(201);
    expect(res.body.data.count).toBe(1);
  });
});

describe("GET /api/availability/:agentId", () => {
  it("returns 404 for an unknown agent", async () => {
    prismaMock.agent.findUnique.mockResolvedValue(null);
    const res = await request(app).get("/api/availability/nonexistent");
    expect(res.status).toBe(404);
  });

  it("lists open (unbooked) slots for an agent", async () => {
    prismaMock.agent.findUnique.mockResolvedValue({ id: "agent_1" });
    prismaMock.agentAvailabilitySlot.findMany.mockResolvedValue([
      { id: "slot_1", isBooked: false, date: new Date(), startTime: "09:00", endTime: "10:00" },
    ]);

    const res = await request(app).get("/api/availability/agent_1");

    expect(res.status).toBe(200);
    expect(res.body.data.slots).toHaveLength(1);
    expect(prismaMock.agentAvailabilitySlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ agentId: "agent_1", isBooked: false }) })
    );
  });
});

describe("DELETE /api/availability/:id", () => {
  it("requires authentication", async () => {
    const res = await request(app).delete("/api/availability/slot_1");
    expect(res.status).toBe(401);
  });

  it("rejects deleting another agent's slot", async () => {
    const token = generateAccessToken("user_1", "agent@example.com", "agent");
    prismaMock.agentAvailabilitySlot.findUnique.mockResolvedValue({ id: "slot_1", agentId: "agent_2", isBooked: false });
    prismaMock.agent.findUnique.mockResolvedValue({ id: "agent_2", userId: "someone_else" });

    const res = await request(app)
      .delete("/api/availability/slot_1")
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.status).toBe(403);
  });

  it("rejects deleting a booked slot", async () => {
    const token = generateAccessToken("user_1", "agent@example.com", "agent");
    prismaMock.agentAvailabilitySlot.findUnique.mockResolvedValue({ id: "slot_1", agentId: "agent_1", isBooked: true });
    prismaMock.agent.findUnique.mockResolvedValue({ id: "agent_1", userId: "user_1" });

    const res = await request(app)
      .delete("/api/availability/slot_1")
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.status).toBe(400);
  });

  it("deletes an unbooked slot owned by the requesting agent", async () => {
    const token = generateAccessToken("user_1", "agent@example.com", "agent");
    prismaMock.agentAvailabilitySlot.findUnique.mockResolvedValue({ id: "slot_1", agentId: "agent_1", isBooked: false });
    prismaMock.agent.findUnique.mockResolvedValue({ id: "agent_1", userId: "user_1" });
    prismaMock.agentAvailabilitySlot.delete.mockResolvedValue({});

    const res = await request(app)
      .delete("/api/availability/slot_1")
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.status).toBe(200);
  });
});
