import express from "express";
import { register, verifyOTP, login, getCurrentUser } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);

// Protected routes
router.get("/me", authenticateToken, getCurrentUser);

export default router;