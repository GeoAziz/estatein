import { Request } from "express";
import type { UserRole } from "@prisma/client";

export type UserType = "buyer" | "seller" | "agent" | "admin";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export type ApiResponse<T> = {
  data: T;
  message?: string;
} | {
  data: null;
  error: {
    code: string;
    message: string;
    details?: any;
    statusCode: number;
    timestamp: string;
    requestId?: string;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  pages: number;
  page: number;
  limit: number;
};
