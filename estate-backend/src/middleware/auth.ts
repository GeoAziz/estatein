import type { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import type { AuthRequest } from "../types/index.js";
import type { UserRole } from "@prisma/client";

function extractAccessToken(req: AuthRequest): string | null {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractAccessToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch {
    next();
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      data: null,
      error: {
        code: "NOT_AUTHENTICATED",
        message: "Not authenticated",
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "You don't have permission to access this resource",
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }
    next();
  };
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractAccessToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    // Token invalid — continue without user
  }
  next();
}
