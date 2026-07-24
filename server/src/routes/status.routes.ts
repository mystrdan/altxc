import { Router } from 'express';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.get('/status', (_req, res) => {
  sendSuccess(res, {
    service: 'altxc-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
