import { Router } from "express";
import * as telemetryController from "../controllers/telemetry.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { ReportErrorSchema, TrackEventSchema } from "../validators/common.js";

const router = Router();

// Public — the whole point is to capture errors/events from anonymous
// visitors too, not just signed-in users. optionalAuth (mounted globally via
// verifyToken in app.ts) still attaches req.user when a session exists, so
// events are tied to a user where possible.
router.post("/error", validate(ReportErrorSchema), telemetryController.reportError);
router.post("/event", validate(TrackEventSchema), telemetryController.trackClientEvent);

// Admin-only read access to what's been captured.
router.get("/events", requireAuth, requireRole("admin"), telemetryController.getEventCounts);
router.get("/errors", requireAuth, requireRole("admin"), telemetryController.getRecentErrors);

export default router;
