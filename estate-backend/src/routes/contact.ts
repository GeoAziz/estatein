import { Router } from "express";
import * as contactController from "../controllers/contact.js";
import { validate } from "../middleware/validation.js";
import { ContactMessageSchema } from "../validators/common.js";

const router = Router();

router.post("/", validate(ContactMessageSchema), contactController.submitContactMessage);

export default router;
