import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as locationsController from "../controllers/locations.js";

const router = Router();

// Get all counties with optional search
router.get("/counties", locationsController.getCounties);

// Get estates for a county or city
router.get("/estates", locationsController.getEstates);

// Search locations (counties and estates)
router.get("/search", locationsController.searchLocations);

// Seed locations data (admin only)
router.post("/seed", requireAuth, locationsController.seedLocations);

export default router;
