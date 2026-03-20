import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../entities/User";
import {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
} from "../utils/jwt";
import { sendEmail } from "../config/email";
import { AuthRequest } from "../middleware/auth";

const userRepo = () => AppDataSource.getRepository(User);

// POST /api/auth/register
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, firstName, lastName, role, phone, address, dateOfBirth, region } = req.body;

    // Check if user already exists
    const existingUser = await userRepo().findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    // Validate role
    const allowedRoles = Object.values(UserRole);
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = userRepo().create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      phone,
      address,
      dateOfBirth,
      region,
    });

    await userRepo().save(user);

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(user.id);
    user.emailVerificationToken = verificationToken;
    await userRepo().save(user);

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    try {
      await sendEmail(
        email,
        "Verify your Homely account",
        `
        <h2>Welcome to Homely, ${firstName}!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#6c63ff;color:white;text-decoration:none;border-radius:8px;">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        `
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    // Generate auth token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Find user
    const user = await userRepo().findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: "Account is deactivated" });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await userRepo().save(user);

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/auth/me
export const getMe = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address,
        profilePhoto: req.user.profilePhoto,
        isEmailVerified: req.user.isEmailVerified,
        region: req.user.region,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/verify-email
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body;

    const decoded = verifyToken(token);
    if (decoded.type !== "email_verification") {
      res.status(400).json({ message: "Invalid token type" });
      return;
    }

    const user = await userRepo().findOne({ where: { id: decoded.userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await userRepo().save(user);

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired verification token" });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email } = req.body;
    const user = await userRepo().findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: "If the email exists, a reset link has been sent" });
      return;
    }

    const resetToken = generatePasswordResetToken(user.id);
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await userRepo().save(user);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    try {
      await sendEmail(
        email,
        "Reset your Homely password",
        `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6c63ff;color:white;text-decoration:none;border-radius:8px;">
          Reset Password
        </a>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        `
      );
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
    }

    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { token, password } = req.body;

    const decoded = verifyToken(token);
    if (decoded.type !== "password_reset") {
      res.status(400).json({ message: "Invalid token type" });
      return;
    }

    const user = await userRepo().findOne({ where: { id: decoded.userId } });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await userRepo().save(user);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired reset token" });
  }
};

// PUT /api/auth/update-profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { firstName, lastName, phone, address, profilePhoto } = req.body;

    const user = await userRepo().findOne({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await userRepo().save(user);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
