import prisma from "../config/database.js";
import { AuthenticationError, NotFoundError } from "../utils/errors.js";
import crypto from "crypto";

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;

function generateSecret(): string {
  return crypto.randomBytes(20).toString("hex");
}

function generateTOTP(secret: string, timeStep: number): string {
  const time = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(time + timeStep));
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const otp =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return (otp % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

export async function enableTwoFactor(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  if (user.twoFactorEnabled) {
    throw new AuthenticationError("Two-factor authentication is already enabled");
  }

  const secret = generateSecret();
  const currentCode = generateTOTP(secret, 0);

  // Store secret temporarily (not enabled yet until verified)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return {
    secret,
    currentCode,
    message: "Verify the current code to enable 2FA",
  };
}

export async function confirmTwoFactor(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  if (!user.twoFactorSecret) {
    throw new AuthenticationError("No 2FA setup in progress. Call enable first.");
  }

  // Check current and previous time step for clock drift tolerance
  const valid =
    generateTOTP(user.twoFactorSecret, 0) === code ||
    generateTOTP(user.twoFactorSecret, -1) === code;

  if (!valid) {
    throw new AuthenticationError("Invalid 2FA code");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return { message: "Two-factor authentication enabled successfully" };
}

export async function verifyTwoFactor(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AuthenticationError("Two-factor authentication is not enabled");
  }

  const valid =
    generateTOTP(user.twoFactorSecret, 0) === code ||
    generateTOTP(user.twoFactorSecret, -1) === code;

  if (!valid) {
    throw new AuthenticationError("Invalid 2FA code");
  }

  return true;
}

export async function disableTwoFactor(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  if (!user.twoFactorEnabled) {
    throw new AuthenticationError("Two-factor authentication is not enabled");
  }

  const valid =
    generateTOTP(user.twoFactorSecret!, 0) === code ||
    generateTOTP(user.twoFactorSecret!, -1) === code;

  if (!valid) {
    throw new AuthenticationError("Invalid 2FA code. Cannot disable without valid code.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return { message: "Two-factor authentication disabled successfully" };
}

export async function getStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });
  if (!user) throw new NotFoundError("User not found");

  return { enabled: user.twoFactorEnabled };
}

/**
 * Generate 10 backup codes for 2FA recovery.
 * Returns plaintext codes once; they are stored hashed in the database.
 */
export async function generateBackupCodes(userId: string): Promise<{ codes: string[] }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  if (!user.twoFactorEnabled) {
    throw new AuthenticationError("Two-factor authentication is not enabled");
  }

  // Generate 10 unique codes
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    plainCodes.push(code);
    const hash = crypto.createHash("sha256").update(code).digest("hex");
    hashedCodes.push(hash);
  }

  // Delete old backup codes and create new ones
  await prisma.twoFactorBackupCode.deleteMany({ where: { userId } });

  await Promise.all(
    hashedCodes.map(codeHash =>
      prisma.twoFactorBackupCode.create({
        data: { userId, codeHash },
      })
    )
  );

  return { codes: plainCodes };
}

/**
 * Verify and use a backup code.
 * Returns true if valid, false if invalid.
 * Marks the code as used if valid.
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  if (!user.twoFactorEnabled) {
    throw new AuthenticationError("Two-factor authentication is not enabled");
  }

  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  const backupCode = await prisma.twoFactorBackupCode.findFirst({
    where: { userId, codeHash, used: false },
  });

  if (!backupCode) {
    throw new AuthenticationError("Invalid or already-used backup code");
  }

  // Mark as used
  await prisma.twoFactorBackupCode.update({
    where: { id: backupCode.id },
    data: { used: true, usedAt: new Date() },
  });

  return true;
}
