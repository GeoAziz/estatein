import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "./helpers/mockPrisma.js";

vi.mock("../config/database.js", () => ({ default: prismaMock, prisma: prismaMock }));

const twoFactorService = await import("../services/twoFactor.js");

beforeEach(() => {
  resetPrismaMock();
});

describe("generateBackupCodes", () => {
  it("generates 10 unique 8-character hex codes", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", twoFactorEnabled: true });
    prismaMock.twoFactorBackupCode.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.twoFactorBackupCode.create.mockResolvedValue({});

    const result = await twoFactorService.generateBackupCodes("user_1");

    expect(result.codes).toHaveLength(10);
    expect(new Set(result.codes).size).toBe(10);
    for (const code of result.codes) {
      expect(code).toMatch(/^[A-F0-9]{8}$/);
    }
  });

  it("throws if 2FA is not enabled", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", twoFactorEnabled: false });

    await expect(twoFactorService.generateBackupCodes("user_1")).rejects.toThrow(
      "Two-factor authentication is not enabled"
    );
  });

  it("deletes old codes before creating new ones", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", twoFactorEnabled: true });
    prismaMock.twoFactorBackupCode.deleteMany.mockResolvedValue({ count: 5 });
    prismaMock.twoFactorBackupCode.create.mockResolvedValue({});

    await twoFactorService.generateBackupCodes("user_1");

    expect(prismaMock.twoFactorBackupCode.deleteMany).toHaveBeenCalledWith({ where: { userId: "user_1" } });
    expect(prismaMock.twoFactorBackupCode.create).toHaveBeenCalledTimes(10);
  });
});

describe("verifyBackupCode", () => {
  it("accepts a valid unused code and marks it used", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", twoFactorEnabled: true });
    prismaMock.twoFactorBackupCode.findFirst.mockResolvedValue({ id: "code_1", used: false });
    prismaMock.twoFactorBackupCode.update.mockResolvedValue({});

    const result = await twoFactorService.verifyBackupCode("user_1", "A1B2C3D4");

    expect(result).toBe(true);
    expect(prismaMock.twoFactorBackupCode.update).toHaveBeenCalledWith({
      where: { id: "code_1" },
      data: expect.objectContaining({ used: true }),
    });
  });

  it("rejects an invalid or already-used code", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", twoFactorEnabled: true });
    prismaMock.twoFactorBackupCode.findFirst.mockResolvedValue(null);

    await expect(twoFactorService.verifyBackupCode("user_1", "DEADBEEF")).rejects.toThrow(
      "Invalid or already-used backup code"
    );
  });

  it("throws if 2FA is not enabled", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", twoFactorEnabled: false });

    await expect(twoFactorService.verifyBackupCode("user_1", "A1B2C3D4")).rejects.toThrow(
      "Two-factor authentication is not enabled"
    );
  });
});
