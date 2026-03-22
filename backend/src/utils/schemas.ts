import { z } from 'zod';

/**
 * Common Zod schemas for request validation
 * Validates: REQ-18.1, REQ-18.2, REQ-18.3, REQ-18.4
 */

// Username validation: alphanumeric, 3-20 characters
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only alphanumeric characters and underscores');

// Email validation: RFC 5322 standard
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be at most 255 characters');

// Password validation: minimum 8 characters, mixed case, numbers
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Problem difficulty
export const difficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);

// Programming language
export const languageSchema = z.enum(['C', 'CPP', 'PYTHON', 'JAVA']);

// Contest scoring rule
export const scoringRuleSchema = z.enum(['IOI', 'ACM']);

// Visibility
export const visibilitySchema = z.enum(['PUBLIC', 'PRIVATE', 'CONTEST_ONLY']);

// Date/time validation
export const dateTimeSchema = z.string().datetime('Invalid datetime format');

// Positive integer
export const positiveIntSchema = z.number().int().positive();

// Non-negative integer
export const nonNegativeIntSchema = z.number().int().min(0);
