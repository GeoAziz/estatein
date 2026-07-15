import { Router } from "express";
import * as neighborhoodsController from "../controllers/neighborhoods.js";

const router = Router();

router.get("/", neighborhoodsController.getNeighborhoods);
router.get("/:id", neighborhoodsController.getNeighborhoodById);
router.get("/:id/demographics", neighborhoodsController.getDemographics);
router.get("/:id/schools", neighborhoodsController.getNeighborhoodSchools);

export default router;
