import { Router } from "express";
import * as controller from "../controllers/supportTickets.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateSupportTicketSchema, UpdateSupportTicketSchema } from "../validators/tenancy.js";

const router = Router();

router.get("/", requireAuth, controller.getSupportTickets);
router.get("/:id", requireAuth, controller.getSupportTicketById);
router.post("/", requireAuth, validate(CreateSupportTicketSchema), controller.createSupportTicket);
router.put("/:id", requireAuth, validate(UpdateSupportTicketSchema), controller.updateSupportTicket);
router.delete("/:id", requireAuth, controller.deleteSupportTicket);

export default router;
