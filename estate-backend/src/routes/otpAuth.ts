import { Router } from "express";
import * as otpAuthController from "../controllers/otpAuth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/request", authLimiter, otpAuthController.requestOtp);
router.post("/verify", authLimiter, otpAuthController.verifyOtp);

export default router;
