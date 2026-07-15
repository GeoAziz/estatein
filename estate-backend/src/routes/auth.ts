import { Router } from "express";
import * as authController from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from "../validators/auth.js";

const router = Router();

router.post("/register", authLimiter, validate(RegisterSchema), authController.register);
router.post("/login", authLimiter, validate(LoginSchema), authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.getMe);
router.post("/forgot-password", authLimiter, validate(ForgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(ResetPasswordSchema), authController.resetPassword);

export default router;
