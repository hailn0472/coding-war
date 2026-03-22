import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Problem schemas
export const problemSearchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  types: z.array(z.string()).optional(),
  pointStart: z.number().optional(),
  pointEnd: z.number().optional(),
  fullText: z.boolean().optional(),
  hideSolved: z.boolean().optional(),
  showTypes: z.boolean().optional(),
  hasPublicEditorial: z.boolean().optional(),
});

// Contest schemas
export const contestJoinSchema = z.object({
  accessCode: z.string().optional(),
});

// User profile schemas
export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  location: z
    .string()
    .max(100, 'Location must be at most 100 characters')
    .optional(),
  organization: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProblemSearchData = z.infer<typeof problemSearchSchema>;
export type ContestJoinData = z.infer<typeof contestJoinSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
