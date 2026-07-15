import { Router } from "express";
import * as controller from "../controllers/maintenanceRequests.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateMaintenanceRequestSchema, UpdateMaintenanceRequestSchema } from "../validators/tenancy.js";

const router = Router();

router.get("/", requireAuth, controller.getMaintenanceRequests);
router.get("/:id", requireAuth, controller.getMaintenanceRequestById);
router.post("/", requireAuth, validate(CreateMaintenanceRequestSchema), controller.createMaintenanceRequest);
router.put("/:id", requireAuth, validate(UpdateMaintenanceRequestSchema), controller.updateMaintenanceRequest);
router.delete("/:id", requireAuth, controller.deleteMaintenanceRequest);

export default router;
