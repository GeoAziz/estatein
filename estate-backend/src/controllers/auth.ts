import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import * as authService from "../services/auth.js";
import { sendSuccess } from "../utils/response.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";
import { trackEvent } from "../services/telemetry.js";

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
