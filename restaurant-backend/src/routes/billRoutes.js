import express from 'express';
import {
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  deleteBill,
  addBillProduct,
  addBillMenu,
  updateBillProduct,
  removeBillProduct,
  getBillsByCustomer,
  getBillsByOrder,
  generateBillNumber,
  updateBillStatus,
  completeBill,
  cancelBill
} from '../controllers/billController.js';
import { verifyToken, requireAdmin } from '../middlewares/authentication.js';

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Bill CRUD routes (Admin only)
router.get('/', requireAdmin, getAllBills);
router.get('/generate-number', requireAdmin, generateBillNumber);
router.get('/:billId', requireAdmin, getBillById);
router.post('/', requireAdmin, createBill);
router.put('/:billId', requireAdmin, updateBill);
router.delete('/:billId', requireAdmin, deleteBill);

// Bill status routes (Admin only)
router.put('/:billId/status', requireAdmin, updateBillStatus);
router.put('/:billId/complete', requireAdmin, completeBill);
router.put('/:billId/cancel', requireAdmin, cancelBill);

// Bill product routes (Admin only)
router.post('/:billId/products', requireAdmin, addBillProduct);
router.post('/:billId/menus', requireAdmin, addBillMenu);
router.put('/products/:billProductId', requireAdmin, updateBillProduct);
router.delete('/products/:billProductId', requireAdmin, removeBillProduct);

// Bill query routes (Admin only)
router.get('/customer/:customerId', requireAdmin, getBillsByCustomer);
router.get('/order/:orderId', requireAdmin, getBillsByOrder);

export default router;
