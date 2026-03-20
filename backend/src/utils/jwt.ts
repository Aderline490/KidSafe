import jwt from "jsonwebtoken";
import { UserRole } from "../entities/User";

const SECRET = process.env.JWT_SECRET || "default-secret";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const generateToken = (userId: string, role: UserRole): string => {
  return jwt.sign({ userId, role }, SECRET, {
    expiresIn: EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateEmailVerificationToken = (userId: string): string => {
  return jwt.sign({ userId, type: "email_verification" }, SECRET, {
    expiresIn: "24h",
  } as jwt.SignOptions);
};

export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign({ userId, type: "password_reset" }, SECRET, {
    expiresIn: "1h",
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, SECRET);
};
