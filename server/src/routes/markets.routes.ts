import { Router } from 'express';
import { listMarkets, getMarket } from '../controllers/markets.controller';

const router = Router();

router.get('/markets', listMarkets);
router.get('/markets/:symbol', getMarket);

export default router;
