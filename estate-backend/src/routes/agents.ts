import { Router } from "express";
import * as agentsController from "../controllers/agents.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateReviewSchema } from "../validators/common.js";

const router = Router();

router.get("/", agentsController.getAgents);
router.get("/:id", agentsController.getAgentById);
router.put("/:id", requireAuth, agentsController.updateAgent);
router.post("/:id/contact", requireAuth, agentsController.contactAgent);
router.get("/:id/reviews", agentsController.getAgentReviews);
router.post("/:id/reviews", requireAuth, validate(CreateReviewSchema), agentsController.createAgentReview);

export default router;
