import { Router } from "express";
import * as dataProtectionController from "../controllers/dataProtection.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/export", requireAuth, dataProtectionController.exportUserData);
router.post("/request-deletion", requireAuth, authLimiter, dataProtectionController.requestDataDeletion);
router.get("/processing-log", requireAuth, dataProtectionController.getDataProcessingLog);

export default router;
