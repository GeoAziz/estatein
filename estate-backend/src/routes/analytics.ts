import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/overview', requireAuth, requireRole('admin'), analyticsController.getOverview);
router.get('/properties/:id', requireAuth, requireRole('admin'), analyticsController.getPropertyAnalytics);
router.get('/agents/:id/performance', requireAuth, requireRole('admin'), analyticsController.getAgentPerformance);
router.get('/regional', requireAuth, requireRole('admin'), analyticsController.getRegionalTrends);
router.get('/export', requireAuth, requireRole('admin'), analyticsController.exportAnalytics);

export default router;
