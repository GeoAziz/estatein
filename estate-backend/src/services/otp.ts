import prisma from "../config/database.js";
import { AuthenticationError, NotFoundError } from "../utils/errors.js";
import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateRandomCode(length: number): string {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
}

export async function generateOtp(userId: string, type: string): Promise<string> {
  // Invalidate any existing unused OTPs of this type for this user
  await prisma.otpCode.updateMany({
    where: { userId, type, used: false },
    data: { used: true },
  });

  const code = generateRandomCode(OTP_LENGTH);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { userId, code, type, expiresAt },
  });

  return code;
}

export async function verifyOtp(userId: string, code: string, type: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, type, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    throw new AuthenticationError("No active OTP found. Please request a new code.");
  }

  if (otp.expiresAt < new Date()) {
    throw new AuthenticationError("OTP has expired. Please request a new code.");
  }

  // Check attempt count (simple brute-force protection)
  const recentAttempts = await prisma.otpCode.count({
    where: {
      userId,
      type,
      createdAt: { gte: new Date(Date.now() - OTP_EXPIRY_MINUTES * 60 * 1000) },
    },
  });

  if (recentAttempts > MAX_OTP_ATTEMPTS) {
    // Invalidate all OTPs for this user
    await prisma.otpCode.updateMany({
      where: { userId, type, used: false },
      data: { used: true },
    });
    throw new AuthenticationError("Too many OTP attempts. Please request a new code.");
  }

  if (otp.code !== code) {
    throw new AuthenticationError("Invalid OTP code.");
  }

  // Mark as used
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return true;
}
