import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.js";
import * as twoFactorService from "../services/twoFactor.js";
import { sendSuccess } from "../utils/response.js";

export async function enable(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await twoFactorService.enableTwoFactor(req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const result = await twoFactorService.confirmTwoFactor(req.user!.id, code);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verify(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const verified = await twoFactorService.verifyTwoFactor(req.user!.id, code);
    sendSuccess(res, { verified, message: "2FA verification successful" });
  } catch (err) {
    next(err);
  }
}

export async function disable(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const result = await twoFactorService.disableTwoFactor(req.user!.id, code);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await twoFactorService.getStatus(req.user!.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
