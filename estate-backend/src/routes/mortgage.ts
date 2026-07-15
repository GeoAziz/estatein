import { Router } from "express";
import * as mortgageController from "../controllers/mortgage.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { MortgageCalculateSchema, PreQualifySchema } from "../validators/common.js";

const router = Router();

router.get("/rates", mortgageController.getRates);
router.post("/calculate", validate(MortgageCalculateSchema), mortgageController.calculateMortgage);
router.post("/pre-qualify", requireAuth, validate(PreQualifySchema), mortgageController.preQualify);

export default router;
