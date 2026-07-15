import { Router } from "express";
import * as favoritesController from "../controllers/favorites.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, favoritesController.getFavorites);
router.post("/:propertyId", requireAuth, favoritesController.addFavorite);
router.delete("/:propertyId", requireAuth, favoritesController.removeFavorite);
router.get("/:propertyId", requireAuth, favoritesController.checkFavorite);

export default router;
