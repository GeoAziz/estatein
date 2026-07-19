import { Router } from 'express';
import * as availabilityController from '../controllers/availability.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { CreateAvailabilitySchema } from '../validators/availability.js';

const router = Router();

/**
 * @route POST /api/availability
 * @access Agent only
 * @body {Array} slots - Array of {date, startTime, endTime} objects
 * @returns {Array} Created availability slots
 */
router.post(
  '/',
  requireAuth,
  requireRole('agent'),
  validate(CreateAvailabilitySchema, 'body'),
  availabilityController.createSlots
);

/**
 * @route GET /api/availability/:agentId
 * @access Public
 * @param {string} agentId - Agent ID
 * @query {string} from - Start date (ISO string, optional)
 * @query {string} to - End date (ISO string, optional)
 * @returns {Array} Available slots for the agent
 */
router.get('/:agentId', optionalAuth, availabilityController.getSlots);

/**
 * @route DELETE /api/availability/:id
 * @access Agent only (owner)
 * @param {string} id - Slot ID
 * @returns {Object} Deletion confirmation
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('agent'),
  availabilityController.deleteSlot
);

export default router;
