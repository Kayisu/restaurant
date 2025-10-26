import express from "express";
import {
  // Menu CRUD
  createMenu,
  updateMenu,
  deleteMenu,
  getMenuByIdAdmin,
  getAllMenus,
  getAllMenusAdmin,
  addProductToMenu,
  removeProductFromMenu,
  updateMenuProductQuantity,
  getMenuItemsWithCalculatedPrice,
  getAllMenuItems,
  // Hard delete
  hardDeleteMenu
} from "../controllers/menuController.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Menu CRUD
router.get("/", verifyToken, getAllMenus); // Staff & Admin - active menus only
router.get("/admin/all", verifyToken, requireAdmin, getAllMenusAdmin); // Admin only - all menus (including inactive)
router.post("/", verifyToken, requireAdmin, createMenu); // Admin only - create menu
router.get("/:menuId", verifyToken, getMenuByIdAdmin); // Staff & Admin - single menu
router.put("/:menuId", verifyToken, requireAdmin, updateMenu); // Admin only - update menu
router.delete("/:menuId", verifyToken, requireAdmin, deleteMenu); // Admin only - delete menu

router.get("/:menuId/items", verifyToken, getAllMenuItems); // Staff & Admin - all menu items
router.get("/:menuId/calculated-price", verifyToken, getMenuItemsWithCalculatedPrice); // Staff & Admin - menu with calculated price
router.post("/:menuId/items", verifyToken, requireAdmin, addProductToMenu); // Admin only - add product to menu
router.put("/:menuId/items/:productId", verifyToken, requireAdmin, updateMenuProductQuantity); // Admin only - update product quantity
router.delete("/:menuId/items/:productId", verifyToken, requireAdmin, removeProductFromMenu); // Admin only - remove product from menu

// Hard delete (Admin only)
router.delete("/:menuId/hard", verifyToken, requireAdmin, hardDeleteMenu); // Admin - hard delete menu

export default router;
