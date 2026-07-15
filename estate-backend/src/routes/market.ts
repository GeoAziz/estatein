import { Router } from "express";
import * as marketController from "../controllers/market.js";

const router = Router();

router.get("/trends/:location", marketController.getTrends);
router.get("/sold/:location", marketController.getSoldData);
router.get("/inventory/:location", marketController.getInventory);
router.get("/days-on-market/:location", marketController.getDaysOnMarket);

export default router;
