import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { TradeRequestWithRelations, TradeWithRelations, MessageWithSender, ListingRow, TradeRequestRow, TradeRow, ProfileRow } from '../types';

// ─── Trade Requests ─────────────────────────────────────────────────────

/** POST /api/v1/trades/request - send a trade request */
export async function sendTradeRequest(req: Request, res: Response, next: NextFunction) {
  const { listingId, message } = req.body;

  try {
    const listingResult = await pool.query<ListingRow & { seller_username: string }>(`
      SELECT l.*, u.username AS seller_username
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      WHERE l.id = $1
    `, [listingId]);

    if (listingResult.rowCount === 0) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    const listing = listingResult.rows[0];

    if (listing.seller_id === req.user!.userId) {
      sendError(res, 'You cannot request a trade on your own listing', 400);
      return;
    }
    if (listing.status !== 'open') {
      sendError(res, 'This listing is no longer open', 400);
      return;
    }

    // Check for existing pending request
    const existingResult = await pool.query<TradeRequestRow>(
      `SELECT id FROM trade_requests WHERE buyer_id = $1 AND listing_id = $2 AND status = 'pending' LIMIT 1`,
      [req.user!.userId, listingId]
    );
    if (existingResult.rowCount && existingResult.rowCount > 0) {
      sendError(res, 'You already have a pending request for this listing', 409);
      return;
    }

    const trResult = await pool.query<TradeRequestRow>(`
      INSERT INTO trade_requests (buyer_id, seller_id, listing_id, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user!.userId, listing.seller_id, listingId, message || '']);

    // Fetch with relations
    const fullResult = await pool.query<TradeRequestWithRelations>(`
      SELECT tr.*,
             b.username AS buyer_username, b.role AS buyer_role,
             s.username AS seller_username, s.role AS seller_role,
             l.type AS listing_type, l.coin AS listing_coin,
             l.amount AS listing_amount, l.price AS listing_price,
             m.name AS market_name, m.symbol AS market_symbol
      FROM trade_requests tr
      JOIN users b ON b.id = tr.buyer_id
      JOIN users s ON s.id = tr.seller_id
      JOIN listings l ON l.id = tr.listing_id
      JOIN markets m ON m.id = l.market_id
      WHERE tr.id = $1
    `, [trResult.rows[0].id]);

    sendSuccess(res, { tradeRequest: fullResult.rows[0] }, 201);
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/trades/requests - get trade requests (sent or received) */
export async function getTradeRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const { direction } = req.query;

    let whereCol: string;
    if (direction === 'sent') {
      whereCol = 'tr.buyer_id';
    } else {
      whereCol = 'tr.seller_id';
    }

    const result = await pool.query<TradeRequestWithRelations>(`
      SELECT tr.*,
             b.username AS buyer_username, b.role AS buyer_role,
             s.username AS seller_username, s.role AS seller_role,
             l.type AS listing_type, l.coin AS listing_coin,
             l.amount AS listing_amount, l.price AS listing_price,
             m.name AS market_name, m.symbol AS market_symbol
      FROM trade_requests tr
      JOIN users b ON b.id = tr.buyer_id
      JOIN users s ON s.id = tr.seller_id
      JOIN listings l ON l.id = tr.listing_id
      JOIN markets m ON m.id = l.market_id
      WHERE ${whereCol} = $1
      ORDER BY tr.created_at DESC
    `, [req.user!.userId]);

    sendSuccess(res, { requests: result.rows });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/trades/requests/:id - accept or decline a trade request */
export async function respondToTradeRequest(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const trResult = await pool.query<TradeRequestRow & { coin: string; amount: string; price: string }>(`
      SELECT tr.*, l.coin, l.amount, l.price
      FROM trade_requests tr
      JOIN listings l ON l.id = tr.listing_id
      WHERE tr.id = $1
    `, [id]);

    if (trResult.rowCount === 0) {
      sendError(res, 'Trade request not found', 404);
      return;
    }

    const tradeRequest = trResult.rows[0];

    if (tradeRequest.seller_id !== req.user!.userId) {
      sendError(res, 'Only the seller can respond to this request', 403);
      return;
    }
    if (tradeRequest.status !== 'pending') {
      sendError(res, 'This request has already been responded to', 400);
      return;
    }

    if (action === 'accepted') {
      // Use a transaction for the multi-step write
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update request status
        await client.query(
          `UPDATE trade_requests SET status = 'accepted', updated_at = now() WHERE id = $1`,
          [id]
        );

        // Close the listing
        await client.query(
          `UPDATE listings SET status = 'closed', updated_at = now() WHERE id = $1`,
          [tradeRequest.listing_id]
        );

        // Update buyer's profile to add this market
        const coinSymbol = tradeRequest.coin;
        const buyerProfileResult = await client.query<ProfileRow>(
          `SELECT * FROM profiles WHERE user_id = $1`,
          [tradeRequest.buyer_id]
        );
        if (buyerProfileResult.rowCount && buyerProfileResult.rows[0]) {
          const bp = buyerProfileResult.rows[0];
          if (!bp.supported_markets.includes(coinSymbol)) {
            await client.query(
              `UPDATE profiles SET supported_markets = array_append(supported_markets, $1), updated_at = now() WHERE user_id = $2`,
              [coinSymbol, tradeRequest.buyer_id]
            );
          }
        }

        // Create the trade
        const totalUsd = Number(tradeRequest.amount) * Number(tradeRequest.price);
        const tradeResult = await client.query<TradeRow>(`
          INSERT INTO trades (buyer_id, seller_id, listing_id, amount, price, total_usd, coin, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
          RETURNING *
        `, [tradeRequest.buyer_id, tradeRequest.seller_id, tradeRequest.listing_id,
            tradeRequest.amount, tradeRequest.price, totalUsd, tradeRequest.coin]);

        await client.query('COMMIT');

        // Fetch trade with relations for the response
        const fullResult = await pool.query<TradeWithRelations>(`
          SELECT t.*,
                 b.username AS buyer_username,
                 s.username AS seller_username,
                 l.type AS listing_type, l.coin AS listing_coin,
                 l.amount AS listing_amount, l.price AS listing_price,
                 m.name AS market_name, m.symbol AS market_symbol
          FROM trades t
          JOIN users b ON b.id = t.buyer_id
          JOIN users s ON s.id = t.seller_id
          JOIN listings l ON l.id = t.listing_id
          JOIN markets m ON m.id = l.market_id
          WHERE t.id = $1
        `, [tradeResult.rows[0].id]);

        sendSuccess(res, { trade: fullResult.rows[0], message: 'Trade request accepted. Trade room created.' });
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        next(err);
        return;
      } finally {
        client.release();
      }
    } else if (action === 'declined') {
      const updated = await pool.query<TradeRequestRow>(
        `UPDATE trade_requests SET status = 'declined', updated_at = now() WHERE id = $1 RETURNING *`,
        [id]
      );
      sendSuccess(res, { tradeRequest: updated.rows[0], message: 'Trade request declined' });
    } else {
      sendError(res, 'Action must be "accepted" or "declined"', 400);
    }
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/trades/requests/:id/cancel - cancel a trade request (buyer only) */
export async function cancelTradeRequest(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;

  try {
    const trResult = await pool.query<TradeRequestRow>(
      `SELECT * FROM trade_requests WHERE id = $1`, [id]
    );

    if (trResult.rowCount === 0) {
      sendError(res, 'Trade request not found', 404);
      return;
    }

    const tradeRequest = trResult.rows[0];

    if (tradeRequest.buyer_id !== req.user!.userId) {
      sendError(res, 'Only the buyer can cancel this request', 403);
      return;
    }
    if (tradeRequest.status !== 'pending') {
      sendError(res, 'This request can no longer be cancelled', 400);
      return;
    }

    const updated = await pool.query<TradeRequestRow>(
      `UPDATE trade_requests SET status = 'cancelled', updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );

    sendSuccess(res, { tradeRequest: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ─── Trades / Trade Room ────────────────────────────────────────────────

/** GET /api/v1/trades - get user's trades */
export async function getMyTrades(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<TradeWithRelations>(`
      SELECT t.*,
             b.username AS buyer_username,
             s.username AS seller_username,
             l.type AS listing_type, l.coin AS listing_coin,
             l.amount AS listing_amount, l.price AS listing_price,
             (SELECT COUNT(*) FROM messages msg WHERE msg.trade_id = t.id) AS message_count
      FROM trades t
      JOIN users b ON b.id = t.buyer_id
      JOIN users s ON s.id = t.seller_id
      JOIN listings l ON l.id = t.listing_id
      WHERE t.buyer_id = $1 OR t.seller_id = $1
      ORDER BY t.created_at DESC
    `, [req.user!.userId]);

    sendSuccess(res, { trades: result.rows });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/trades/:id - get trade room details */
export async function getTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const tradeResult = await pool.query<TradeWithRelations>(`
      SELECT t.*,
             b.username AS buyer_username,
             s.username AS seller_username,
             l.type AS listing_type, l.coin AS listing_coin,
             l.amount AS listing_amount, l.price AS listing_price,
             m.name AS market_name, m.symbol AS market_symbol
      FROM trades t
      JOIN users b ON b.id = t.buyer_id
      JOIN users s ON s.id = t.seller_id
      JOIN listings l ON l.id = t.listing_id
      JOIN markets m ON m.id = l.market_id
      WHERE t.id = $1
    `, [req.params.id]);

    if (tradeResult.rowCount === 0) {
      sendError(res, 'Trade not found', 404);
      return;
    }

    const trade = tradeResult.rows[0];

    // Verify user is part of this trade
    if (trade.buyer_id !== req.user!.userId && trade.seller_id !== req.user!.userId) {
      sendError(res, 'Access denied', 403);
      return;
    }

    // Get messages
    const messagesResult = await pool.query<MessageWithSender>(`
      SELECT msg.*, u.username AS sender_username
      FROM messages msg
      JOIN users u ON u.id = msg.sender_id
      WHERE msg.trade_id = $1
      ORDER BY msg.created_at ASC
    `, [trade.id]);

    sendSuccess(res, { trade: { ...trade, messages: messagesResult.rows } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/trades/:id/messages - send a message in a trade room */
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const tradeResult = await pool.query<TradeRow>(
      `SELECT id, buyer_id, seller_id FROM trades WHERE id = $1`, [id]
    );

    if (tradeResult.rowCount === 0) {
      sendError(res, 'Trade not found', 404);
      return;
    }

    const trade = tradeResult.rows[0];
    if (trade.buyer_id !== req.user!.userId && trade.seller_id !== req.user!.userId) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const messageResult = await pool.query<MessageWithSender>(`
      INSERT INTO messages (content, sender_id, trade_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [content, req.user!.userId, id]);

    const msg = messageResult.rows[0];

    sendSuccess(res, {
      message: {
        id: msg.id,
        content: msg.content,
        createdAt: msg.created_at,
        senderId: msg.sender_id,
        tradeId: msg.trade_id,
        sender: { id: req.user!.userId, username: req.user!.username },
      },
    }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/trades/:id/status - update trade status */
export async function updateTradeStatus(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const tradeResult = await pool.query<TradeRow>(
      `SELECT * FROM trades WHERE id = $1`, [id]
    );

    if (tradeResult.rowCount === 0) {
      sendError(res, 'Trade not found', 404);
      return;
    }

    const trade = tradeResult.rows[0];

    if (trade.buyer_id !== req.user!.userId && trade.seller_id !== req.user!.userId) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const validTransitions: Record<string, string[]> = {
      pending: ['in_escrow', 'cancelled'],
      in_escrow: ['completed', 'disputed'],
      completed: [],
      cancelled: [],
      disputed: [],
    };

    const allowed = validTransitions[trade.status] || [];
    if (!allowed.includes(status)) {
      sendError(res, `Cannot transition from ${trade.status} to ${status}`, 400);
      return;
    }

    let sets = `status = $1, updated_at = now()`;
    const params: any[] = [status];
    let paramIdx = 2;

    if (status === 'completed') {
      sets += `, completed_at = $${paramIdx++}`;
      params.push(new Date());
    }

    params.push(id);

    await pool.query(
      `UPDATE trades SET ${sets} WHERE id = $${paramIdx}`,
      params
    );

    // Update trade counts on profiles if completed
    if (status === 'completed') {
      await pool.query(
        `UPDATE profiles SET completed_trades = completed_trades + 1, updated_at = now() WHERE user_id IN ($1, $2)`,
        [trade.buyer_id, trade.seller_id]
      );
    }

    // Fetch updated trade
    const updatedResult = await pool.query<TradeRow>(
      `SELECT * FROM trades WHERE id = $1`, [id]
    );

    sendSuccess(res, { trade: updatedResult.rows[0] });
  } catch (err) {
    next(err);
  }
}