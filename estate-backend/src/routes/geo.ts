import { Router } from 'express';
import * as geoController from '../controllers/geo.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { NearbySchema, SearchBoundsSchema, DistanceSchema } from '../validators/geo.js';

const router = Router();

/**
 * @route GET /api/geo/nearby
 * @query {number} lat - Latitude
 * @query {number} lng - Longitude
 * @query {number} radiusKm - Radius in kilometers (default: 5)
 * @returns {Object} amenities - Array of nearby amenities (schools, neighborhoods, estates)
 */
router.get('/nearby', optionalAuth, validate(NearbySchema, 'query'), geoController.getNearby);

/**
 * @route POST /api/geo/search-bounds
 * @body {Object} polygon - Array of {lat, lng} points forming a polygon
 * @returns {Object} properties - Array of properties within the polygon
 */
router.post('/search-bounds', optionalAuth, validate(SearchBoundsSchema, 'body'), geoController.searchByBounds);

/**
 * @route GET /api/geo/distance
 * @query {number} fromLat - Starting latitude
 * @query {number} fromLng - Starting longitude
 * @query {number} toLat - Destination latitude
 * @query {number} toLng - Destination longitude
 * @returns {Object} straightLineDistance - Distance in kilometers
 */
router.get('/distance', optionalAuth, validate(DistanceSchema, 'query'), geoController.getDistance);

export default router;
