import { Router } from "express";
import * as inquiriesController from "../controllers/inquiries.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateInquirySchema, ReplySchema, UpdateInquiryStatusSchema, UpdateViewingStatusSchema } from "../validators/common.js";

const router = Router();

router.get("/", requireAuth, inquiriesController.getInquiries);
router.get("/:id", requireAuth, inquiriesController.getInquiryById);
router.post("/", requireAuth, validate(CreateInquirySchema), inquiriesController.createInquiry);
router.put("/:id/status", requireAuth, validate(UpdateInquiryStatusSchema), inquiriesController.updateInquiryStatus);
router.put("/:id/viewing-status", requireAuth, validate(UpdateViewingStatusSchema), inquiriesController.updateViewingStatus);
router.post("/:id/reply", requireAuth, validate(ReplySchema), inquiriesController.replyToInquiry);
router.delete("/:id", requireAuth, inquiriesController.deleteInquiry);

export default router;
