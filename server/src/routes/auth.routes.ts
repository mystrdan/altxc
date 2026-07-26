import { Router } from 'express';
import { register, login, logout, logoutAll, me, refresh, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validators';
import { requireAuth } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limit auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many attempts. Please try again later.' } },
});

router.post('/auth/register', authLimiter, validateBody(registerSchema), register);
router.post('/auth/login', authLimiter, validateBody(loginSchema), login);
router.post('/auth/refresh', authLimiter, validateBody(refreshTokenSchema), refresh);
router.post('/auth/logout', requireAuth, logout);
router.post('/auth/logout-all', requireAuth, logoutAll);
router.get('/auth/me', requireAuth, me);
router.post('/auth/forgot-password', authLimiter, forgotPassword);
router.post('/auth/reset-password', authLimiter, resetPassword);

export default router;