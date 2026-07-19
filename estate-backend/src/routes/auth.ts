import { Router } from "express";
import * as authController from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SendOtpSchema,
  VerifyOtpSchema,
  RequestOtpLoginSchema,
  VerifyOtpLoginSchema,
  Confirm2FASchema,
  VerifyLogin2FASchema,
} from "../validators/auth.js";

const router = Router();

router.post("/register", authLimiter, validate(RegisterSchema), authController.register);
router.post("/login", authLimiter, validate(LoginSchema), authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.getMe);
router.post("/forgot-password", authLimiter, validate(ForgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(ResetPasswordSchema), authController.resetPassword);

// OTP-based login (passwordless)
router.post("/otp/login/request", authLimiter, validate(RequestOtpLoginSchema), authController.requestOtpLogin);
router.post("/otp/login/verify", authLimiter, validate(VerifyOtpLoginSchema), authController.verifyOtpLogin);

// Generic authenticated OTP (e.g. phone verification)
router.post("/otp/send", requireAuth, validate(SendOtpSchema), authController.sendOtp);
router.post("/otp/verify", requireAuth, validate(VerifyOtpSchema), authController.verifyOtp);

// Two-factor authentication
router.post("/2fa/enable", requireAuth, authController.enable2FA);
router.post("/2fa/confirm", requireAuth, validate(Confirm2FASchema), authController.confirm2FA);
router.post("/2fa/disable", requireAuth, validate(Confirm2FASchema), authController.disable2FA);
router.post("/2fa/verify-login", authLimiter, validate(VerifyLogin2FASchema), authController.verifyLogin2FA);

// Two-factor backup codes
router.post("/2fa/backup-codes/generate", requireAuth, authController.generateBackupCodes);
router.post("/2fa/backup-codes/verify", authLimiter, authController.verifyBackupCode);

export default router;
