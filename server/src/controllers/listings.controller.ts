import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { ListingWithRelations, MarketRow, ListingRow } from '../types';

/** GET /api/v1/listings - list all open listings with filters */
export async function listListings(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, coin, marketId, status, sellerId, sort } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (type) { conditions.push(`l.type = $${idx++}`); params.push(String(type).toUpperCase()); }
    if (coin) { conditions.push(`LOWER(l.coin) = LOWER($${idx++})`); params.push(String(coin)); }
    if (marketId) { conditions.push(`l.market_id = $${idx++}`); params.push(String(marketId)); }
    if (status) { conditions.push(`l.status = $${idx++}`); params.push(String(status).toUpperCase()); }
    if (sellerId) { conditions.push(`l.seller_id = $${idx++}`); params.push(String(sellerId)); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY l.created_at DESC';
    if (sort === 'oldest') orderClause = 'ORDER BY l.created_at ASC';
    else if (sort === 'price_asc') orderClause = 'ORDER BY l.price ASC';
    else if (sort === 'price_desc') orderClause = 'ORDER BY l.price DESC';

    const sql = `
      SELECT l.*,
             u.username AS seller_username, u.role AS seller_role,
             m.name AS market_name, m.symbol AS market_symbol,
             (SELECT COUNT(*) FROM trade_requests tr WHERE tr.listing_id = l.id) AS trade_request_count
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      JOIN markets m ON m.id = l.market_id
      ${whereClause}
      ${orderClause}
    `;

    const result = await pool.query<ListingWithRelations>(sql, params);
    sendSuccess(res, { listings: result.rows });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/listings/:id - single listing detail */
export async function getListing(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<ListingWithRelations>(`
      SELECT l.*,
             u.username AS seller_username, u.role AS seller_role,
             m.name AS market_name, m.symbol AS market_symbol
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      JOIN markets m ON m.id = l.market_id
      WHERE l.id = $1
    `, [req.params.id]);

    if (result.rowCount === 0) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    sendSuccess(res, { listing: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/listings - create a new listing */
export async function createListing(req: Request, res: Response, next: NextFunction) {
  const { type, coin, amount, price, marketId } = req.body;

  try {
    // Verify market exists
    const marketCheck = await pool.query<MarketRow>(`SELECT id FROM markets WHERE id = $1`, [marketId]);
    if (marketCheck.rowCount === 0) {
      sendError(res, 'Market not found', 404);
      return;
    }

    const result = await pool.query<ListingWithRelations>(`
      INSERT INTO listings (type, coin, amount, price, payment_currency, seller_id, market_id)
      VALUES ($1, $2, $3, $4, 'USDT', $5, $6)
      RETURNING *
    `, [String(type).toUpperCase(), String(coin).toUpperCase(), amount, price, req.user!.userId, marketId]);

    const listing = result.rows[0];

    // Fetch relations for the response
    const fullResult = await pool.query<ListingWithRelations>(`
      SELECT l.*,
             u.username AS seller_username, u.role AS seller_role,
             m.name AS market_name, m.symbol AS market_symbol
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      JOIN markets m ON m.id = l.market_id
      WHERE l.id = $1
    `, [listing.id]);

    sendSuccess(res, { listing: fullResult.rows[0] }, 201);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/listings/:id - update a listing (owner only) */
export async function updateListing(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { type, coin, amount, price, status } = req.body;

  try {
    const existing = await pool.query<ListingRow>(`SELECT * FROM listings WHERE id = $1`, [id]);
    if (existing.rowCount === 0) {
      sendError(res, 'Listing not found', 404);
      return;
    }
    if (existing.rows[0].seller_id !== req.user!.userId) {
      sendError(res, 'You can only edit your own listings', 403);
      return;
    }

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (type !== undefined) { sets.push(`type = $${idx++}`); params.push(String(type).toUpperCase()); }
    if (coin !== undefined) { sets.push(`coin = $${idx++}`); params.push(String(coin).toUpperCase()); }
    if (amount !== undefined) { sets.push(`amount = $${idx++}`); params.push(amount); }
    if (price !== undefined) { sets.push(`price = $${idx++}`); params.push(price); }
    if (status !== undefined) { sets.push(`status = $${idx++}`); params.push(String(status).toUpperCase()); }

    if (sets.length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    sets.push(`updated_at = now()`);
    params.push(id);

    await pool.query(
      `UPDATE listings SET ${sets.join(', ')} WHERE id = $${idx}`, params
    );

    const fullResult = await pool.query<ListingWithRelations>(`
      SELECT l.*,
             u.username AS seller_username, u.role AS seller_role,
             m.name AS market_name, m.symbol AS market_symbol
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      JOIN markets m ON m.id = l.market_id
      WHERE l.id = $1
    `, [id]);

    sendSuccess(res, { listing: fullResult.rows[0] });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/listings/:id - close/delete a listing (owner only) */
export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;

  try {
    const existing = await pool.query<ListingRow>(`SELECT * FROM listings WHERE id = $1`, [id]);
    if (existing.rowCount === 0) {
      sendError(res, 'Listing not found', 404);
      return;
    }
    if (existing.rows[0].seller_id !== req.user!.userId) {
      sendError(res, 'You can only delete your own listings', 403);
      return;
    }

    await pool.query(`UPDATE listings SET status = 'closed', updated_at = now() WHERE id = $1`, [id]);
    sendSuccess(res, { message: 'Listing closed' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/listings/my - get current user's listings */
export async function getMyListings(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<ListingWithRelations>(`
      SELECT l.*,
             m.name AS market_name, m.symbol AS market_symbol,
             (SELECT COUNT(*) FROM trade_requests tr WHERE tr.listing_id = l.id) AS trade_request_count
      FROM listings l
      JOIN markets m ON m.id = l.market_id
      WHERE l.seller_id = $1
      ORDER BY l.created_at DESC
    `, [req.user!.userId]);

    sendSuccess(res, { listings: result.rows });
  } catch (err) {
    next(err);
  }
}