import { Router } from "express";
import * as controller from "../controllers/mortgageApplications.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import {
  CreateMortgageApplicationSchema,
  UpdateMortgageApplicationSchema,
  UpdateMortgageStatusSchema,
} from "../validators/tenancy.js";

const router = Router();

router.get("/", requireAuth, controller.getMortgageApplications);
router.get("/:id", requireAuth, controller.getMortgageApplicationById);
router.post("/", requireAuth, validate(CreateMortgageApplicationSchema), controller.createMortgageApplication);
router.put("/:id", requireAuth, validate(UpdateMortgageApplicationSchema), controller.updateMortgageApplication);
router.delete("/:id", requireAuth, controller.deleteMortgageApplication);
router.put("/:id/status", requireAuth, validate(UpdateMortgageStatusSchema), controller.updateMortgageStatus);

export default router;
