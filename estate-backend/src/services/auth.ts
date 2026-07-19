import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { ConflictError, AuthenticationError, NotFoundError } from "../utils/errors.js";
import { v4 as uuidv4 } from "uuid";
import { generateOtp, verifyOtp } from "./otp.js";
import { createSmsProvider, SMS_TEMPLATES } from "./sms.js";
import type { UserRole } from "@prisma/client";

const smsProvider = createSmsProvider({
  provider: (process.env.SMS_PROVIDER || "africastalking") as any,
  apiKey: process.env.SMS_API_KEY || "",
  apiSecret: process.env.SMS_API_SECRET,
  senderId: process.env.SMS_SENDER_ID || "ESTATEIN",
});

export async function register(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: "buyer" | "agent";
  company?: string;
  license?: string;
  licenseState?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone,
      role: data.role || "buyer",
      verificationStatus: "unverified",
    },
  });

  if (data.role === "agent") {
    await prisma.agent.create({
      data: {
        userId: user.id,
        brokerage: data.company,
        licenseNumber: data.license,
        licenseState: data.licenseState,
      },
    });
  }

  const token = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
    token,
    refreshToken,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  const passwordMatch = await comparePassword(password, user.passwordHash);
  if (!passwordMatch) {
    throw new AuthenticationError("Invalid email or password");
  }

  if (!user.isActive) {
    throw new AuthenticationError("Account has been suspended");
  }

  if (user.twoFactorEnabled) {
    return { requires2FA: true as const, userId: user.id };
  }

  return generateSessionForUser(user);
}

// Shared by password login (once 2FA is confirmed), OTP-based login, and the
// 2FA login-verification step — anywhere a session needs to be minted for a
// user we've already authenticated by some other means.
export function generateSessionForUser(user: { id: string; email: string; name: string; role: UserRole; phone: string | null }) {
  const token = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
    token,
    refreshToken,
  };
}

export async function requestOtpLogin(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Deliberately don't reveal whether the account exists — the controller
  // always returns a generic "check your phone" response either way.
  if (!user || !user.isActive || !user.phone) return;

  const code = await generateOtp(user.id, "login");
  try {
    await smsProvider.send(user.phone, SMS_TEMPLATES.VERIFICATION_CODE(code));
  } catch {
    // The endpoint always returns a generic success response regardless —
    // an SMS provider outage shouldn't surface as a 500 or leak account state.
  }
}

export async function verifyOtpLogin(email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthenticationError("Invalid or expired code");
  }
  if (!user.isActive) {
    throw new AuthenticationError("Account has been suspended");
  }

  await verifyOtp(user.id, code, "login");

  return generateSessionForUser(user);
}

export async function refreshAccessToken(refreshToken: string) {
  const decoded = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.isActive) {
    throw new AuthenticationError("Invalid refresh token");
  }

  const token = generateAccessToken(user.id, user.email, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  return { token, refreshToken: newRefreshToken };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      bio: true,
      role: true,
      verificationStatus: true,
      isActive: true,
      twoFactorEnabled: true,
      createdAt: true,
      agent: {
        select: {
          id: true,
          licenseNumber: true,
          licenseState: true,
          brokerage: true,
          yearsExperience: true,
          serviceAreas: true,
          specialties: true,
          totalSales: true,
          averageSalePrice: true,
          rating: true,
          reviewCount: true,
          verified: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

export async function generatePasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal whether user exists
    return { success: true, message: "If an account exists, a reset link has been sent" };
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store token in activity log (simplified — in production use a dedicated table)
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "password_reset_request",
      details: { token, expiresAt: expiresAt.toISOString() },
    },
  });

  return { success: true, message: "If an account exists, a reset link has been sent" };
}

export async function resetPassword(token: string, newPassword: string) {
  const log = await prisma.activityLog.findFirst({
    where: {
      action: "password_reset_request",
      details: { path: ["token"], equals: token },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!log) {
    throw new AuthenticationError("Invalid or expired reset token");
  }

  const details = log.details as any;
  if (new Date(details.expiresAt) < new Date()) {
    throw new AuthenticationError("Reset token has expired");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: log.userId },
    data: { passwordHash },
  });

  // Delete the reset token log
  await prisma.activityLog.delete({ where: { id: log.id } });

  return { success: true, message: "Password reset successfully" };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const passwordMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!passwordMatch) {
    throw new AuthenticationError("Current password is incorrect");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true, message: "Password updated successfully" };
}

export async function generateBackupCodes(userId: string) {
  const twoFactor = await import("./twoFactor.js");
  const result = await twoFactor.generateBackupCodes(userId);
  return { codes: result.codes, message: "Backup codes generated. Store them in a safe place." };
}

export async function verifyBackupCode(userId: string, code: string) {
  const twoFactor = await import("./twoFactor.js");
  return await twoFactor.verifyBackupCode(userId, code);
}
