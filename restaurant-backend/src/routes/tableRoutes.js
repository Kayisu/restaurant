import express from "express";
import {
  getAllTables,
  getDashboardStats,
  getDashboardDebug,
  getTableSections,
  getSectionSummary,
  getSectionTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  updateTableReservationStatus,
  clearTableCustomer,
  getTableOrders,
  createTableOrder,
  getActiveTableOrder
} from "../controllers/tableController.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";
import { validateCreateTable, validateUpdateTable } from "../middlewares/inputValidator.js";

const router = express.Router();

// Table management (Admin only for CRUD operations)
router.get("/", verifyToken, getAllTables);
router.post("/", verifyToken, requireAdmin, validateCreateTable, createTable);
router.put("/:tableId", verifyToken, requireAdmin, validateUpdateTable, updateTable);
router.delete("/:tableId", verifyToken, requireAdmin, deleteTable);

// Dashboard routes
router.get("/dashboard", verifyToken, getAllTables);
router.get("/dashboard/stats", verifyToken, getDashboardStats);
router.get("/dashboard/debug", verifyToken, getDashboardDebug);

// Section-based routes (specific routes first)
router.get("/sections/summary", verifyToken, getSectionSummary);
router.get("/sections", verifyToken, getTableSections);
router.get("/sections/:sectionCode", verifyToken, getSectionTables);

// Table details
router.get("/:tableId", verifyToken, getTableById);
router.put("/:tableId/status", verifyToken, updateTableStatus);
router.put("/:tableId/reservation", verifyToken, updateTableReservationStatus);
router.post("/:tableId/clear", verifyToken, clearTableCustomer);

// Order management
router.get("/:tableId/orders", verifyToken, getTableOrders);
router.post("/:tableId/orders", verifyToken, requireAdmin, createTableOrder);
router.get("/:tableId/orders/active", verifyToken, getActiveTableOrder);

export default router;
