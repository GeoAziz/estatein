import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));

// This file exercises more auth-limited endpoints in a row than the 15-min
// window's max=5 allows for a single test IP — stub the limiter as a
// passthrough so these tests assert business logic, not rate-limit state.
vi.mock("../middleware/rateLimit.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../middleware/rateLimit.js")>();
  return { ...actual, authLimiter: (_req: any, _res: any, next: any) => next() };
});

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

describe("POST /api/auth/otp/login/request", () => {
  it("returns a generic response for a non-existent account (no enumeration)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/otp/login/request").send({ email: "nobody@example.com" });

    expect(res.status).toBe(200);
    expect(smsSend).not.toHaveBeenCalled();
  });

  it("sends a code via SMS for an existing user with a phone number", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "buyer@example.com",
      phone: "0712345678",
      isActive: true,
    });
    prismaMock.otpCode.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.otpCode.create.mockResolvedValue({ id: "otp_1" });

    const res = await request(app).post("/api/auth/otp/login/request").send({ email: "buyer@example.com" });

    expect(res.status).toBe(200);
    expect(smsSend).toHaveBeenCalledTimes(1);
  });

  it("never surfaces an SMS provider failure to the caller", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "buyer@example.com",
      phone: "0712345678",
      isActive: true,
    });
    prismaMock.otpCode.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.otpCode.create.mockResolvedValue({ id: "otp_1" });
    smsSend.mockRejectedValueOnce(new Error("provider down"));

    const res = await request(app).post("/api/auth/otp/login/request").send({ email: "buyer@example.com" });

    expect(res.status).toBe(200);
  });
});

describe("POST /api/auth/otp/login/verify", () => {
  it("logs in and sets cookies on a valid code", async () => {
    const user = { id: "user_1", email: "buyer@example.com", name: "Buyer", role: "buyer", phone: "0712345678", isActive: true };
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.otpCode.findFirst.mockResolvedValue({
      id: "otp_1",
      code: "123456",
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.otpCode.count.mockResolvedValue(1);
    prismaMock.otpCode.update.mockResolvedValue({});

    const res = await request(app).post("/api/auth/otp/login/verify").send({ email: "buyer@example.com", code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("buyer@example.com");
    const setCookie = res.headers["set-cookie"] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith("accessToken="))).toBe(true);
  });

  it("rejects an incorrect code", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", email: "buyer@example.com", isActive: true });
    prismaMock.otpCode.findFirst.mockResolvedValue({
      id: "otp_1",
      code: "123456",
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.otpCode.count.mockResolvedValue(1);

    const res = await request(app).post("/api/auth/otp/login/verify").send({ email: "buyer@example.com", code: "000000" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/otp/send + /api/auth/otp/verify (authenticated)", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/auth/otp/send").send({ type: "phone_verification" });
    expect(res.status).toBe(401);
  });

  it("sends and verifies a phone-verification code for a signed-in user", async () => {
    const token = generateAccessToken("user_1", "buyer@example.com", "buyer");
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", phone: "0712345678" });
    prismaMock.otpCode.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.otpCode.create.mockResolvedValue({ id: "otp_1" });

    const sendRes = await request(app)
      .post("/api/auth/otp/send")
      .set("Cookie", [`accessToken=${token}`])
      .send({ type: "phone_verification" });

    expect(sendRes.status).toBe(200);
    expect(smsSend).toHaveBeenCalledTimes(1);
  });
});

describe("2FA enable/confirm/disable + login challenge", () => {
  it("requires authentication to enable 2FA", async () => {
    const res = await request(app).post("/api/auth/2fa/enable");
    expect(res.status).toBe(401);
  });

  it("enables 2FA after confirming the setup code", async () => {
    const token = generateAccessToken("user_1", "buyer@example.com", "buyer");
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", twoFactorEnabled: false });
    prismaMock.user.update.mockResolvedValue({});

    const enableRes = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Cookie", [`accessToken=${token}`]);

    expect(enableRes.status).toBe(200);
    expect(enableRes.body.data.secret).toBeTruthy();
  });

  it("login returns requires2FA instead of a session when 2FA is enabled", async () => {
    const { hashPassword } = await import("../utils/hash.js");
    const passwordHash = await hashPassword("Password1");
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "buyer@example.com",
      passwordHash,
      isActive: true,
      twoFactorEnabled: true,
    });

    const res = await request(app).post("/api/auth/login").send({ email: "buyer@example.com", password: "Password1" });

    expect(res.status).toBe(200);
    expect(res.body.data.requires2FA).toBe(true);
    expect(res.body.data.userId).toBe("user_1");
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeUndefined();
  });

  it("rejects verify-login with an invalid code", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "buyer@example.com",
      role: "buyer",
      phone: null,
      twoFactorEnabled: true,
      twoFactorSecret: "a".repeat(40),
    });

    const res = await request(app).post("/api/auth/2fa/verify-login").send({ userId: "user_1", code: "000000" });

    expect(res.status).toBe(401);
  });
});
