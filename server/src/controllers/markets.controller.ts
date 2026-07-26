import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { MarketRow, ListingRow, ProfileRow } from '../types';

/** GET /api/v1/markets - list all markets with stats (public) */
export async function listMarkets(_req: Request, res: Response, next: NextFunction) {
  try {
    const marketsResult = await pool.query<MarketRow & { active_listings: string }>(`
      SELECT m.*,
             (SELECT COUNT(*) FROM listings l WHERE l.market_id = m.id) AS active_listings
      FROM markets m
      ORDER BY m.symbol ASC
    `);

    const enriched = await Promise.all(
      marketsResult.rows.map(async (market) => {
        const activeResult = await pool.query<ListingRow>(
          `SELECT type, seller_id FROM listings WHERE market_id = $1 AND status = 'open'`,
          [market.id]
        );

        const buyerCount = activeResult.rows.filter((l) => l.type === 'buy').length;
        const sellerCount = activeResult.rows.filter((l) => l.type === 'sell').length;

        const sellerIds = [...new Set(activeResult.rows.map((l) => l.seller_id))];
        let avgRating: number | null = null;
        if (sellerIds.length > 0) {
          const profilesResult = await pool.query<ProfileRow>(
            `SELECT trust_score FROM profiles WHERE user_id = ANY($1)`,
            [sellerIds]
          );
          const total = profilesResult.rows.reduce((sum, p) => sum + Number(p.trust_score), 0);
          avgRating = profilesResult.rows.length > 0 ? total / profilesResult.rows.length : null;
        }

        return {
          id: market.id,
          name: market.name,
          symbol: market.symbol,
          logoUrl: market.logo_url,
          status: market.status,
          activeListings: Number(market.active_listings),
          buyerCount,
          sellerCount,
          avgMerchantRating: avgRating ? Math.round(avgRating * 100) / 100 : null,
          createdAt: market.created_at,
        };
      })
    );

    sendSuccess(res, { markets: enriched });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/markets/:symbol - single market detail (public) */
export async function getMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<MarketRow>(
      `SELECT * FROM markets WHERE LOWER(symbol) = LOWER($1) LIMIT 1`,
      [req.params.symbol]
    );

    if (result.rowCount === 0) {
      sendError(res, 'Market not found', 404);
      return;
    }

    sendSuccess(res, { market: result.rows[0] });
  } catch (err) {
    next(err);
  }
}