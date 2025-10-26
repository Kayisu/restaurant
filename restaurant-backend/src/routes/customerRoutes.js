import express from 'express';
import { verifyToken } from '../middlewares/authentication.js';
import { validateCustomerInput } from '../middlewares/customerValidator.js';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomerStats,
} from '../controllers/customerController.js';

const router = express.Router();

// Apply authentication to all customer routes
router.use(verifyToken);

// Customer routes
router.post('/', validateCustomerInput, createCustomer);
router.get('/search', searchCustomers);

// General customer routes
router.get('/', getAllCustomers);
router.get('/stats', getCustomerStats);
router.get('/:id', getCustomerById);
router.put('/:id', validateCustomerInput, updateCustomer);
router.delete('/:id', deleteCustomer);



export default router;
