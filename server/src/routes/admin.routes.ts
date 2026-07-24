import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  marketSchema,
  updateUserRoleSchema,
  reportStatusSchema,
} from '../utils/validators';
import {
  listUsers,
  updateUserRole,
  createMarket,
  updateMarket,
  deleteMarket,
  listReports,
  updateReportStatus,
  getSettings,
} from '../controllers/admin.controller';

const router = Router();

// Every admin route requires a valid JWT AND the 'admin' role.
router.use(requireAuth, requireRole('admin'));

router.get('/users', listUsers);
router.patch('/users/:id/role', validateBody(updateUserRoleSchema), updateUserRole);

router.post('/markets', validateBody(marketSchema), createMarket);
router.patch('/markets/:id', validateBody(marketSchema.partial()), updateMarket);
router.delete('/markets/:id', deleteMarket);

router.get('/reports', listReports);
router.patch('/reports/:id/status', validateBody(reportStatusSchema), updateReportStatus);

router.get('/settings', getSettings);

export default router;
