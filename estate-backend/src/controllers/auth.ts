import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import * as authService from "../services/auth.js";
import * as otpService from "../services/otp.js";
import * as twoFactorService from "../services/twoFactor.js";
import { createSmsProvider, SMS_TEMPLATES } from "../services/sms.js";
import prisma from "../config/database.js";
import { sendSuccess } from "../utils/response.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";
import { trackEvent } from "../services/telemetry.js";

const smsProvider = createSmsProvider({
  provider: (process.env.SMS_PROVIDER || "africastalking") as any,
  apiKey: process.env.SMS_API_KEY || "",
  apiSecret: process.env.SMS_API_SECRET,
  senderId: process.env.SMS_SENDER_ID || "ESTATEIN",
});

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    setAuthCookies(res, result.token, result.refreshToken);
    trackEvent("user_registered", result.user.id, { role: result.user.role }).catch(() => {});
    sendSuccess(res, { user: result.user }, 201, "Account created successfully");
  } catch (err) {
    next(err);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if ("requires2FA" in result) {
      return sendSuccess(res, { requires2FA: true, userId: result.userId });
    }

    setAuthCookies(res, result.token, result.refreshToken);
    sendSuccess(res, { user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function requestOtpLogin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await authService.requestOtpLogin(req.body.email);
    // Always a generic response — don't reveal whether the account exists.
    sendSuccess(res, { message: "If an account with a registered phone number exists, a code has been sent." });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpLogin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyOtpLogin(email, code);
    setAuthCookies(res, result.token, result.refreshToken);
    sendSuccess(res, { user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function sendOtp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.phone) {
      return res.status(400).json({ data: null, error: { code: "NO_PHONE", message: "Add a phone number to your profile first", statusCode: 400, timestamp: new Date().toISOString() } });
    }
    const code = await otpService.generateOtp(req.user!.id, req.body.type || "phone_verification");
    await smsProvider.send(user.phone, SMS_TEMPLATES.VERIFICATION_CODE(code));
    sendSuccess(res, { message: "Verification code sent" });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, type } = req.body;
    await otpService.verifyOtp(req.user!.id, code, type || "phone_verification");
    sendSuccess(res, { verified: true });
  } catch (err) {
    next(err);
  }
}

export async function enable2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await twoFactorService.enableTwoFactor(req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function confirm2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await twoFactorService.confirmTwoFactor(req.user!.id, req.body.code);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function disable2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await twoFactorService.disableTwoFactor(req.user!.id, req.body.code);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verifyLogin2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId, code } = req.body;
    await twoFactorService.verifyTwoFactor(userId, code);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    const result = authService.generateSessionForUser(user);
    setAuthCookies(res, result.token, result.refreshToken);
    sendSuccess(res, { user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ data: null, error: { code: "NO_REFRESH_TOKEN", message: "Refresh token required", statusCode: 401, timestamp: new Date().toISOString() } });
    }
    const result = await authService.refreshAccessToken(token);
    setAuthCookies(res, result.token, result.refreshToken);
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: AuthRequest, res: Response) {
  clearAuthCookies(res);
  res.json({ data: { success: true }, message: "Logged out successfully" });
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.generatePasswordResetToken(req.body.email);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function generateBackupCodes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await authService.generateBackupCodes(req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/**
 * Verify a backup code and complete a pending 2FA login, issuing session tokens
 * exactly as `verifyLogin2FA` does for TOTP codes.
 */
export async function verifyBackupCode(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId, code } = req.body;
    await authService.verifyBackupCode(userId, code);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    const result = authService.generateSessionForUser(user);
    setAuthCookies(res, result.token, result.refreshToken);
    sendSuccess(res, { user: result.user });
  } catch (err) {
    next(err);
  }
}
