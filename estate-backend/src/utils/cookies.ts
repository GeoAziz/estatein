import type { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

const ACCESS_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // matches default JWT_EXPIRES_IN of 24h
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // matches default JWT_REFRESH_EXPIRES_IN of 7d

export function setAuthCookies(res: Response, token: string, refreshToken: string) {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  // Scoped to /api/auth so it's only ever sent to the refresh/logout endpoints
  // that need it, not on every request.
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/api/auth" });
}
