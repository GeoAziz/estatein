import { Router } from "express";
import * as accountController from "../controllers/account.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/deactivate", requireAuth, authLimiter, accountController.deactivate);
router.post("/reactivate", requireAuth, accountController.reactivate);
router.post("/request-deletion", requireAuth, authLimiter, accountController.requestDeletion);
router.post("/cancel-deletion", requireAuth, accountController.cancelDeletion);

export default router;
