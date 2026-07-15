import { Router } from "express";
import * as usersController from "../controllers/users.js";
import { changePassword } from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { ChangePasswordSchema } from "../validators/auth.js";

const router = Router();

router.get("/:id", requireAuth, usersController.getUser);
router.put("/:id", requireAuth, usersController.updateUser);
router.put("/:id/password", requireAuth, validate(ChangePasswordSchema), changePassword);
router.get("/:id/activity", requireAuth, usersController.getUserActivity);

export default router;
