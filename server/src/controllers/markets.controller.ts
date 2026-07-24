import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/apiResponse';

/** GET /api/v1/markets - list all markets (public) */
export async function listMarkets(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query(
      'SELECT id, name, symbol, logo_url, status, created_at FROM markets ORDER BY symbol ASC'
    );
    sendSuccess(res, { markets: result.rows });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/markets/:symbol - single market detail (public) */
export async function getMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query(
      'SELECT id, name, symbol, logo_url, status, created_at FROM markets WHERE UPPER(symbol) = UPPER($1)',
      [req.params.symbol]
    );
    const market = result.rows[0];
    if (!market) {
      sendError(res, 'Market not found', 404);
      return;
    }
    sendSuccess(res, { market });
  } catch (err) {
    next(err);
  }
}
