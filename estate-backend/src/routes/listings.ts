import { Router } from "express";
import * as listingsController from "../controllers/listings.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { CreateListingSchema, UpdateListingSchema, ListingStatusSchema, ListingFilterSchema } from "../validators/listings.js";

const router = Router();

router.get("/", validate(ListingFilterSchema, "query"), listingsController.getListings);
router.get("/:id", listingsController.getListingById);
router.post("/", requireAuth, validate(CreateListingSchema), listingsController.createListing);
router.put("/:id", requireAuth, validate(UpdateListingSchema), listingsController.updateListing);
router.delete("/:id", requireAuth, listingsController.deleteListing);
router.put("/:id/status", requireAuth, validate(ListingStatusSchema), listingsController.updateListingStatus);
router.get("/:id/analytics", requireAuth, listingsController.getListingAnalytics);

export default router;
