import { Router } from 'express';
import {
  sendTradeRequest,
  getTradeRequests,
  respondToTradeRequest,
  cancelTradeRequest,
  getMyTrades,
  getTrade,
  sendMessage,
  updateTradeStatus,
} from '../controllers/trades.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  sendTradeRequestSchema,
  respondToTradeRequestSchema,
  sendMessageSchema,
  updateTradeStatusSchema,
} from '../utils/validators';

const router = Router();

// All trade routes require authentication
router.use(requireAuth);

// Trade requests
router.get('/trades/requests', getTradeRequests);
router.post('/trades/request', validateBody(sendTradeRequestSchema), sendTradeRequest);
router.patch('/trades/requests/:id', validateBody(respondToTradeRequestSchema), respondToTradeRequest);
router.patch('/trades/requests/:id/cancel', cancelTradeRequest);

// Trades / Trade Room
router.get('/trades', getMyTrades);
router.get('/trades/:id', getTrade);
router.patch('/trades/:id/status', validateBody(updateTradeStatusSchema), updateTradeStatus);

// Messages
router.post('/trades/:id/messages', validateBody(sendMessageSchema), sendMessage);

export default router;