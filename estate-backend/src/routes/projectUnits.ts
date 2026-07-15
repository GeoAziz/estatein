import { Router } from "express";
import * as controller from "../controllers/projectUnits.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/phase/:phaseId", optionalAuth, controller.getUnitsByPhase);
router.get("/:id", optionalAuth, controller.getUnitById);
router.post("/phase/:phaseId", requireAuth, controller.createUnit);
router.put("/:id", requireAuth, controller.updateUnit);
router.delete("/:id", requireAuth, controller.deleteUnit);
router.post("/:id/reserve", requireAuth, controller.reserveUnit);

export default router;
