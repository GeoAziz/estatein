import { Router } from "express";
import * as adminController from "../controllers/admin.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { AdminApproveSchema, AdminRejectSchema, AdminUserStatusSchema } from "../validators/common.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/pending-listings", adminController.getPendingListings);
router.put("/listings/:id/approve", validate(AdminApproveSchema), adminController.approveListing);
router.put("/listings/:id/reject", validate(AdminRejectSchema), adminController.rejectListing);
router.get("/users", adminController.getUsers);
router.put("/users/:id/status", validate(AdminUserStatusSchema), adminController.updateUserStatus);
router.get("/stats", adminController.getStats);

export default router;
