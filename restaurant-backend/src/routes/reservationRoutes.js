import express from 'express';
import { verifyToken, requireStaff } from '../middlewares/authentication.js';
import { validateReservationInput } from '../middlewares/reservationValidator.js';
import {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
  getReservationsByTable,
  getTodayReservations,
  getReservationStats,
  getAdvancedFilteredReservations,
  getTableAvailability,
  checkOverdueReservations,
  getOverdueReservations
} from '../controllers/reservationController.js';

const router = express.Router();

// Apply authentication and staff authorization to all reservation routes
router.use(verifyToken);
router.use(requireStaff);

// Reservation routes
router.post('/', validateReservationInput, createReservation);
router.get('/', getAllReservations);

// Specific routes (must come before /:id)
router.get('/today', getTodayReservations);
router.get('/stats', getReservationStats);
router.get('/overdue', getOverdueReservations);
router.get('/advanced/filter', getAdvancedFilteredReservations);
router.get('/availability', getTableAvailability);
router.get('/table/:tableId', getReservationsByTable);

// Overdue check route
router.post('/check-overdue', checkOverdueReservations);

// Dynamic routes (must come last)
router.get('/:id', getReservationById);
router.put('/:id', validateReservationInput, updateReservation);
router.delete('/:id', deleteReservation);

export default router;
