import { Router } from "express";
import * as controller from "../controllers/developerProjects.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, controller.getDeveloperProjects);
router.get("/:id", optionalAuth, controller.getDeveloperProjectById);
router.get("/slug/:slug", optionalAuth, controller.getDeveloperProjectBySlug);
router.post("/", requireAuth, controller.createDeveloperProject);
router.put("/:id", requireAuth, controller.updateDeveloperProject);
router.delete("/:id", requireAuth, controller.deleteDeveloperProject);

export default router;
