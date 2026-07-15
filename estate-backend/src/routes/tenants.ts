import { Router } from "express";
import * as controller from "../controllers/tenants.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateTenantSchema, UpdateTenantSchema } from "../validators/tenancy.js";

const router = Router();

router.get("/", requireAuth, controller.getTenants);
router.get("/:id", requireAuth, controller.getTenantById);
router.post("/", requireAuth, validate(CreateTenantSchema), controller.createTenant);
router.put("/:id", requireAuth, validate(UpdateTenantSchema), controller.updateTenant);
router.delete("/:id", requireAuth, controller.deleteTenant);

export default router;
