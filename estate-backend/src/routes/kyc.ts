import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as kycController from "../controllers/kyc.js";

const router = Router();

// User submits KYC verification
router.post("/submit", requireAuth, kycController.submitVerification);

// User views their own verification status (or admin views any)
router.get("/status", requireAuth, kycController.getVerificationStatus);

export default router;
