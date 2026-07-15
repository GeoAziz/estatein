import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth.js";
import type { JWTPayload } from "../types/index.js";
import type { UserRole } from "@prisma/client";

export function generateAccessToken(userId: string, email: string, role: UserRole): string {
  const payload = { userId, email, role };
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, authConfig.jwtRefreshSecret, {
    expiresIn: authConfig.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, authConfig.jwtSecret) as JWTPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, authConfig.jwtRefreshSecret) as { userId: string };
}
