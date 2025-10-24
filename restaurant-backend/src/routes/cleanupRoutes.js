import express from "express";
import {
  dailyFileCleanup,
  weeklyCleanup,
  monthlyCleanup,
  manualCleanup
} from "../controllers/cleanupController.js";
import { verifyToken, requireAdmin } from "../middlewares/authentication.js";

const router = express.Router();

// Cleanup routes (Admin only)
router.post("/daily", verifyToken, requireAdmin, dailyFileCleanup);
router.post("/weekly", verifyToken, requireAdmin, weeklyCleanup);
router.post("/monthly", verifyToken, requireAdmin, monthlyCleanup);
router.post("/manual", verifyToken, requireAdmin, manualCleanup);

export default router;
