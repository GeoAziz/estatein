import { Router } from "express";
import * as controller from "../controllers/projectPhases.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/project/:projectId", optionalAuth, controller.getPhasesByProject);
router.get("/:id", optionalAuth, controller.getPhaseById);
router.post("/project/:projectId", requireAuth, controller.createPhase);
router.put("/:id", requireAuth, controller.updatePhase);
router.delete("/:id", requireAuth, controller.deletePhase);

export default router;
