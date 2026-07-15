import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import * as otpService from "../services/otp.js";
import prisma from "../config/database.js";
import { NotFoundError, AuthenticationError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";

export async function requestOtp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, type = "login" } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether user exists
      sendSuccess(res, { message: "If an account exists, an OTP has been sent" });
      return;
    }

    const code = await otpService.generateOtp(user.id, type);

    // In production, send via email/SMS here
    // For now, include in response for development
    sendSuccess(res, {
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV === "development" && { code }),
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, code, type = "login" } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    const verified = await otpService.verifyOtp(user.id, code, type);
    sendSuccess(res, { verified, message: "OTP verified successfully" });
  } catch (err) {
    next(err);
  }
}
