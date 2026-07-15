import { Router } from "express";
import * as twoFactorController from "../controllers/twoFactor.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/enable", requireAuth, twoFactorController.enable);
router.post("/confirm", requireAuth, twoFactorController.confirm);
router.post("/verify", requireAuth, authLimiter, twoFactorController.verify);
router.post("/disable", requireAuth, authLimiter, twoFactorController.disable);
router.get("/status", requireAuth, twoFactorController.getStatus);

export default router;
