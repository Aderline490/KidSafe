import { Router } from "express";
import {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../utils/validators";

const router = Router();

// Public routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);

// Protected routes
router.get("/me", authenticate, getMe);
router.put("/update-profile", authenticate, updateProfile);

export default router;
