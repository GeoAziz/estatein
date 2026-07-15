import { Router } from "express";
import * as controller from "../controllers/systemSettings.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// System settings are internal config; every route here is admin-only.
router.use(requireAuth, requireRole("admin"));

router.get("/", controller.getSystemSettings);
router.get("/:key", controller.getSystemSettingByKey);
router.post("/", controller.createSystemSetting);
router.put("/:key", controller.updateSystemSetting);
router.delete("/:key", controller.deleteSystemSetting);
router.post("/bulk", controller.getSystemSettingsBulk);

export default router;
