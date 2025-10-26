import express from "express";
import {
  getCategories,
  getCategorySubcategories,
  getSubcategoryProducts,
  getActiveProducts,
  searchProducts,
  getProductById,
  getProductOptions,
  // Category CRUD
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getAllCategories,
  // Subcategory CRUD
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoryById,
  getAllSubcategories,
  // Product CRUD
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByIdAdmin,
  getAllProducts,
  // Hard delete operations
  hardDeleteCategory,
  hardDeleteSubcategory,
  hardDeleteProduct
} from "../controllers/catalogController.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Categories
router.get("/categories", verifyToken, getCategories);
router.get("/categories/all", verifyToken, getAllCategories); // Staff & Admin - all categories
router.post("/categories", verifyToken, createCategory); // Staff & Admin - create category
router.get("/categories/:categoryId", verifyToken, getCategoryById); // Staff & Admin - single category
router.put("/categories/:categoryId", verifyToken, updateCategory); // Staff & Admin - update category
router.delete("/categories/:categoryId", verifyToken, requireAdmin, deleteCategory); // Admin only - soft delete category
router.delete("/categories/:id/hard", verifyToken, requireAdmin, hardDeleteCategory); // Admin only - hard delete category
router.get("/categories/:categoryId/subcategories", verifyToken, getCategorySubcategories);

// Subcategories
router.get("/subcategories", verifyToken, getAllSubcategories); // Staff & Admin - all subcategories
router.post("/subcategories", verifyToken, createSubcategory); // Staff & Admin - create subcategory
router.get("/subcategories/:subcategoryId", verifyToken, getSubcategoryById); // Staff & Admin - single subcategory
router.put("/subcategories/:subcategoryId", verifyToken, updateSubcategory); // Staff & Admin - update subcategory
router.delete("/subcategories/:subcategoryId", verifyToken, requireAdmin, deleteSubcategory); // Admin only - soft delete subcategory
router.delete("/subcategories/:id/hard", verifyToken, requireAdmin, hardDeleteSubcategory); // Admin only - hard delete subcategory
router.get("/subcategories/:subcategoryId/products", verifyToken, getSubcategoryProducts);

// Products
router.get("/products/active", verifyToken, getActiveProducts);
router.get("/products/search", searchProducts);
router.get("/products/:productId", verifyToken, getProductById);
router.get("/products/:productId/options", verifyToken, getProductOptions);
// Product CRUD
router.get("/products", verifyToken, getAllProducts); // Staff & Admin - all products
router.post("/products", verifyToken, createProduct); // Staff & Admin - create product
router.get("/products/:productId/admin", verifyToken, getProductByIdAdmin); // Staff & Admin - single product
router.put("/products/:productId", verifyToken, updateProduct); // Staff & Admin - update product
router.delete("/products/:productId", verifyToken, requireAdmin, deleteProduct); // Admin only - soft delete product
router.delete("/products/:productId/hard", verifyToken, requireAdmin, hardDeleteProduct); // Admin only - hard delete product

export default router;
