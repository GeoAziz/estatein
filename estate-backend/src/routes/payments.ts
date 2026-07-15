import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as paymentsController from "../controllers/payments.js";

const router = Router();

// Initiate a payment
router.post("/initiate", requireAuth, paymentsController.initiatePayment);

// M-Pesa callback endpoint (no auth required - called by M-Pesa).
// Protected by a secret token in the path instead of a JWT, since Safaricom
// calls this directly and does not sign its payloads.
router.post("/mpesa/callback/:callbackToken", paymentsController.mpesaCallback);

// Check payment status
router.get("/:paymentId/status", requireAuth, paymentsController.checkPaymentStatus);

// Get payment history
router.get("/", requireAuth, paymentsController.getPaymentHistory);

export default router;
