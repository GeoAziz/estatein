import { Router } from "express";
import * as savedSearchesController from "../controllers/savedSearches.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateSavedSearchSchema, UpdateSavedSearchSchema } from "../validators/common.js";

const router = Router();

router.get("/", requireAuth, savedSearchesController.getSavedSearches);
router.post("/", requireAuth, validate(CreateSavedSearchSchema), savedSearchesController.createSavedSearch);
router.put("/:id", requireAuth, validate(UpdateSavedSearchSchema), savedSearchesController.updateSavedSearch);
router.delete("/:id", requireAuth, savedSearchesController.deleteSavedSearch);
router.post("/:id/alert", requireAuth, savedSearchesController.triggerAlert);

export default router;
