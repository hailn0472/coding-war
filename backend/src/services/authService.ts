import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

/**
 * Authentication Service
 * Handles password hashing, JWT token generation/validation, and verification tokens
 */

const BCRYPT_COST_FACTOR = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

/**
 * Hash a password using bcrypt with cost factor 12
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate an access token (JWT) with 7-day expiration
 * @param userId - User ID
 * @param role - User role (admin, user, guest)
 * @returns JWT access token
 */
export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate a refresh token (JWT) with 30-day expiration
 * @param userId - User ID
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify and decode an access token
 * @param token - JWT access token
 * @returns Decoded token payload with userId and role, or null if invalid
 */
export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token
 * @returns Decoded token payload with userId, or null if invalid
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate an email verification token with 24-hour expiration
 * @returns Object containing token and expiry date
 */
export function generateEmailVerificationToken(): { token: string; expiry: Date } {
  const token = randomUUID();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);
  
  return { token, expiry };
}

/**
 * Generate a password reset token with 1-hour expiration
 * @returns Object containing token and expiry date
 */
export function generatePasswordResetToken(): { token: string; expiry: Date } {
  const token = randomUUID();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + PASSWORD_RESET_EXPIRY_HOURS);
  
  return { token, expiry };
}
