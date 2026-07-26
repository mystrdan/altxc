import { z } from 'zod';

// Usernames: alphanumeric + underscore, 3-30 chars
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
  identifier: z.string().trim().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
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

export const createListingSchema = z.object({
  type: z.enum(['buy', 'sell']),
  coin: z.string().trim().min(1).max(10),
  amount: z.number().positive('Amount must be positive'),
  price: z.number().positive('Price must be positive'),
  marketId: z.string().uuid('Invalid market ID'),
});

export const updateListingSchema = z.object({
  type: z.enum(['buy', 'sell']).optional(),
  coin: z.string().trim().min(1).max(10).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  price: z.number().positive('Price must be positive').optional(),
  status: z.enum(['open', 'closed']).optional(),
});

export const sendTradeRequestSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  message: z.string().trim().max(500).optional(),
});

export const respondToTradeRequestSchema = z.object({
  action: z.enum(['accepted', 'declined']),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message is required').max(2000, 'Message too long'),
});

export const updateTradeStatusSchema = z.object({
  status: z.enum(['pending', 'in_escrow', 'completed', 'cancelled', 'disputed']),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(280).optional(),
  supportedMarkets: z.array(z.string()).optional(),
});