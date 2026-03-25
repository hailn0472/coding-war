import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '../../src/../src/services/authService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Authentication Service', () => {
  // Set environment variables for testing
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should produce Argon2id hashes (not bcrypt)', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      // Argon2id hashes start with $argon2id$
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should verify bcrypt-hashed password (backward compatibility)', async () => {
      const password = 'LegacyPassword123!';
      const bcryptHash = await bcrypt.hash(password, 12);
      const isValid = await verifyPassword(password, bcryptHash);
      
      expect(isValid).toBe(true);
    });

    it('should reject wrong password against bcrypt hash', async () => {
      const password = 'LegacyPassword123!';
      const bcryptHash = await bcrypt.hash(password, 12);
      const isValid = await verifyPassword('WrongPassword456!', bcryptHash);
      
      expect(isValid).toBe(false);
    });

    it('should correctly identify bcrypt hashes as needing rehash', async () => {
      const bcryptHash = await bcrypt.hash('test', 12);
      expect(needsRehash(bcryptHash)).toBe(true);
    });

    it('should correctly identify argon2id hashes as not needing rehash', async () => {
      const argon2Hash = await hashPassword('test');
      expect(needsRehash(argon2Hash)).toBe(false);
    });
  });

  describe('JWT Access Token', () => {
    it('should generate access token with userId and role', () => {
      const userId = 'user-123';
      const role = 'user';
      const token = generateAccessToken(userId, role);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include userId and role in token payload', () => {
      const userId = 'user-456';
      const role = 'admin';
      const token = generateAccessToken(userId, role);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
    });

    it('should verify valid access token', () => {
      const userId = 'user-789';
      const role = 'user';
      const token = generateAccessToken(userId, role);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(userId);
      expect(decoded?.role).toBe(role);
    });

    it('should reject invalid access token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should reject expired access token', () => {
      const userId = 'user-expired';
      const role = 'user';
      const expiredToken = jwt.sign(
        { userId, role },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' } // Already expired
      );
      const decoded = verifyToken(expiredToken);
      
      expect(decoded).toBeNull();
    });

    it('should reject token with wrong secret', () => {
      const userId = 'user-wrong-secret';
      const role = 'user';
      const wrongToken = jwt.sign(
        { userId, role },
        'wrong-secret',
        { expiresIn: '7d' }
      );
      const decoded = verifyToken(wrongToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('JWT Refresh Token', () => {
    it('should generate refresh token with userId', () => {
      const userId = 'user-123';
      const token = generateRefreshToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should include userId in refresh token payload', () => {
      const userId = 'user-456';
      const token = generateRefreshToken(userId);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.userId).toBe(userId);
    });

    it('should verify valid refresh token', () => {
      const userId = 'user-789';
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(userId);
    });

    it('should reject invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';
      const decoded = verifyRefreshToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should reject expired refresh token', () => {
      const userId = 'user-expired';
      const expiredToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '-1s' }
      );
      const decoded = verifyRefreshToken(expiredToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('Email Verification Token', () => {
    it('should generate email verification token', () => {
      const { token, expiry } = generateEmailVerificationToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(expiry).toBeInstanceOf(Date);
    });

    it('should generate unique tokens', () => {
      const token1 = generateEmailVerificationToken();
      const token2 = generateEmailVerificationToken();
      
      expect(token1.token).not.toBe(token2.token);
    });

    it('should set expiry to 24 hours from now', () => {
      const { expiry } = generateEmailVerificationToken();
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Allow 1 second tolerance for test execution time
      const diff = Math.abs(expiry.getTime() - expectedExpiry.getTime());
      expect(diff).toBeLessThan(1000);
    });

    it('should generate valid UUID format', () => {
      const { token } = generateEmailVerificationToken();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      expect(uuidRegex.test(token)).toBe(true);
    });
  });

  describe('Password Reset Token', () => {
    it('should generate password reset token', () => {
      const { token, expiry } = generatePasswordResetToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(expiry).toBeInstanceOf(Date);
    });

    it('should generate unique tokens', () => {
      const token1 = generatePasswordResetToken();
      const token2 = generatePasswordResetToken();
      
      expect(token1.token).not.toBe(token2.token);
    });

    it('should set expiry to 1 hour from now', () => {
      const { expiry } = generatePasswordResetToken();
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Allow 1 second tolerance for test execution time
      const diff = Math.abs(expiry.getTime() - expectedExpiry.getTime());
      expect(diff).toBeLessThan(1000);
    });

    it('should generate valid UUID format', () => {
      const { token } = generatePasswordResetToken();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      expect(uuidRegex.test(token)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      const isValid = await verifyPassword(longPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const hash = await hashPassword(specialPassword);
      const isValid = await verifyPassword(specialPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = '密码测试🔐🚀';
      const hash = await hashPassword(unicodePassword);
      const isValid = await verifyPassword(unicodePassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle different user roles in token', () => {
      const roles = ['admin', 'user', 'guest'];
      
      roles.forEach(role => {
        const token = generateAccessToken('user-123', role);
        const decoded = verifyToken(token);
        
        expect(decoded?.role).toBe(role);
      });
    });
  });
});
