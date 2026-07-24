import { z } from 'zod';

// Usernames: alphanumeric + underscore, 3-30 chars. Keeps profile URLs clean.
const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email('Invalid email address').max(255),
  password: passwordSchema,
});

export const loginSchema = z.object({
  // Allow login via username OR email in a single field for convenience.
  identifier: z.string().trim().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const reportSchema = z.object({
  reportedUsername: usernameSchema,
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters').max(500),
});

export const marketSchema = z.object({
  name: z.string().trim().min(1).max(50),
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .transform((s) => s.toUpperCase()),
  logo_url: z.string().trim().max(500).optional(),
  status: z.enum(['active', 'paused', 'delisted']).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'merchant', 'admin']),
});

export const reportStatusSchema = z.object({
  status: z.enum(['open', 'reviewing', 'resolved', 'dismissed']),
});
