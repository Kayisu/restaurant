import express from "express";
import {createUser, getAllUsers, getUserById, deleteUser, loginUser, logoutUser, updateOwnCredentials, adminUpdateCredentials, getUserProfile} from "../controllers/userController.js";
import { validateUser, validateLogin, validateUpdateOwnCredentials, validateAdminUpdateCredentials } from "../middlewares/inputValidator.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Public routes
router.post("/login", validateLogin, loginUser);
router.post('/logout', logoutUser);

// User profile routes
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, validateUpdateOwnCredentials, updateOwnCredentials);

// Protected routes (admin only)
router.post("/register", verifyToken, requireAdmin, validateUser, createUser);
router.post("/", verifyToken, requireAdmin, validateUser, createUser);
router.get("/", verifyToken, requireAdmin, getAllUsers);
router.get("/:id", verifyToken, requireAdmin, getUserById);
router.put("/:id", verifyToken, requireAdmin, validateAdminUpdateCredentials, adminUpdateCredentials);
router.delete("/:id", verifyToken, requireAdmin, deleteUser);

export default router;
