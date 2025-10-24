import express from "express";
import {
  getAllOrders,
  seatCustomer,
  createOrder,
  addFromCatalog,
  addFromMenu,
  getOrder,
  updateOrderItem,
  removeOrderItem,
  updateOrderStatus,
  getMenus,
  getMenuDetails,
  getTableActiveOrder,
  closeOrder,
  deleteOrder,
  cancelOrder,
} from "../controllers/orderController.js";
import { verifyToken, requireStaff } from "../middlewares/authentication.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
router.get("/", requireStaff, getAllOrders);
router.post("/seat-customer", requireStaff, seatCustomer);
router.post("/create", requireStaff, createOrder);
router.post("/add-from-catalog", requireStaff, addFromCatalog);
router.post("/add-from-menu", requireStaff, addFromMenu);
router.delete("/:orderId", requireStaff, deleteOrder);
router.get("/:orderId", requireStaff, getOrder);
router.get("/table/:tableId/active", requireStaff, getTableActiveOrder);
router.put("/:orderId/items/:itemId", requireStaff, updateOrderItem);
router.delete("/:orderId/items/:itemId", requireStaff, removeOrderItem);
router.put("/:orderId/status", requireStaff, updateOrderStatus);
router.put("/:orderId/close", requireStaff, closeOrder);
router.put("/:orderId/cancel", requireStaff, cancelOrder);
router.get("/menus/list", requireStaff, getMenus);
router.get("/menus/:menuId", requireStaff, getMenuDetails);

export default router;
