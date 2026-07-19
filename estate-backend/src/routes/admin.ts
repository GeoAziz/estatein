import { Router } from "express";
import * as adminController from "../controllers/admin.js";
import * as kycController from "../controllers/kyc.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { AdminApproveSchema, AdminRejectSchema, AdminUserStatusSchema, AdminVerifyUserSchema } from "../validators/common.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/pending-listings", adminController.getPendingListings);
router.put("/listings/:id/approve", validate(AdminApproveSchema), adminController.approveListing);
router.put("/listings/:id/reject", validate(AdminRejectSchema), adminController.rejectListing);
router.get("/users", adminController.getUsers);
router.put("/users/:id/status", validate(AdminUserStatusSchema), adminController.updateUserStatus);
router.get("/stats", adminController.getStats);
router.post("/reindex", adminController.reindexProperties);

// KYC verification endpoints
router.get("/pending-verification", kycController.getPendingVerifications);
router.put("/users/:id/verify", validate(AdminVerifyUserSchema), kycController.adminApproveVerification);

export default router;
