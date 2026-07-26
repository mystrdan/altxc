import { Router } from 'express';
import { getProfileByUsername, getDashboard, createReport, updateProfile } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { reportSchema, updateProfileSchema } from '../utils/validators';

const router = Router();

router.get('/dashboard', requireAuth, getDashboard);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), updateProfile);
router.post('/reports', requireAuth, validateBody(reportSchema), createReport);
router.get('/profile/:username', getProfileByUsername);

export default router;