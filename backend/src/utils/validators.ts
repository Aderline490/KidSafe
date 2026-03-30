import { body } from "express-validator";

export const registerValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase, one lowercase, and one number"
    ),
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required"),
  body("role").notEmpty().withMessage("Role is required"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
];

export const registerStaffValidation = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase, one lowercase, and one number"
    ),
  body("inviteToken").notEmpty().withMessage("Invite token is required"),
];

export const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase, one lowercase, and one number"
    ),
];
