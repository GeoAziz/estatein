import { Router } from "express";
import * as propertiesController from "../controllers/properties.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { PropertyFilterSchema, CreatePropertySchema, UpdatePropertySchema } from "../validators/properties.js";

const router = Router();

router.get("/", validate(PropertyFilterSchema, "query"), propertiesController.getProperties);
router.get("/search", validate(PropertyFilterSchema, "query"), propertiesController.getProperties);
router.get("/:id", optionalAuth, propertiesController.getPropertyById);
router.get("/slug/:slug", optionalAuth, propertiesController.getPropertyBySlug);
router.post("/:id/views", optionalAuth, propertiesController.incrementViews);
router.get("/:id/comparable", propertiesController.getComparableProperties);
router.get("/:id/price-history", propertiesController.getPriceHistory);
router.get("/:id/zestimate", propertiesController.getZestimate);

// CRUD (agent/admin only)
router.post("/", requireAuth, validate(CreatePropertySchema), propertiesController.createProperty);
router.put("/:id", requireAuth, validate(UpdatePropertySchema), propertiesController.updateProperty);
router.delete("/:id", requireAuth, propertiesController.deleteProperty);

export default router;
