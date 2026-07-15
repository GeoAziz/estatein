import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));

const { default: app } = await import("../app.js");
const { hashPassword } = await import("../utils/hash.js");

beforeEach(() => {
  resetPrismaMock();
});

describe("POST /api/auth/register", () => {
  it("creates a new user and sets auth cookies", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user_1",
      email: "buyer@example.com",
      name: "Test Buyer",
      role: "buyer",
      phone: "0712345678",
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "buyer@example.com",
      password: "Password1",
      name: "Test Buyer",
      phone: "0712345678",
      role: "buyer",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe("buyer@example.com");
    expect(res.body.data.token).toBeUndefined(); // tokens live in cookies, not the body
    const setCookie = res.headers["set-cookie"] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith("accessToken="))).toBe(true);
    expect(setCookie.some((c) => c.startsWith("refreshToken="))).toBe(true);
    expect(setCookie.every((c) => c.toLowerCase().includes("httponly"))).toBe(true);
  });

  it("rejects a duplicate email with 409", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing", email: "buyer@example.com" });

    const res = await request(app).post("/api/auth/register").send({
      email: "buyer@example.com",
      password: "Password1",
      name: "Test Buyer",
      phone: "0712345678",
      role: "buyer",
    });

    expect(res.status).toBe(409);
    expect(res.body.data).toBeNull();
  });

  it("rejects a weak password with a 400 validation error", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "buyer@example.com",
      password: "weak",
      name: "Test Buyer",
      phone: "0712345678",
      role: "buyer",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const passwordHash = await hashPassword("Password1");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "buyer@example.com",
      name: "Test Buyer",
      role: "buyer",
      phone: "0712345678",
      passwordHash,
      isActive: true,
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "buyer@example.com",
      password: "Password1",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("buyer@example.com");
  });

  it("rejects an incorrect password with 401", async () => {
    const passwordHash = await hashPassword("Password1");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "buyer@example.com",
      passwordHash,
      isActive: true,
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "buyer@example.com",
      password: "WrongPassword1",
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("NOT_AUTHENTICATED");
  });
});
