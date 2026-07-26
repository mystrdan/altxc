import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { UserRow, MarketRow, ListingRow, ReportRow, UserRole, MarketStatus, ReportStatus } from '../types';

/** GET /api/v1/admin/users */
export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<UserRow & { trust_score: string; completed_trades: number; trade_volume_usd: string }>(`
      SELECT u.id, u.username, u.email, u.role, u.created_at, u.last_seen_at,
             COALESCE(p.trust_score, '0') AS trust_score,
             COALESCE(p.completed_trades, 0) AS completed_trades
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
    `);

    const mapped = result.rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      role: r.role,
      createdAt: r.created_at,
      lastSeenAt: r.last_seen_at,
      trustScore: Number(r.trust_score),
      completedTrades: r.completed_trades,
    }));

    sendSuccess(res, { users: mapped });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/admin/users/:id/role */
export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { role } = req.body as { role: UserRole };

  try {
    const result = await pool.query<UserRow>(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role`,
      [role, id]
    );
    if (result.rowCount === 0) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, { user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ---- Markets --------------------------------------------------------------

/** POST /api/v1/admin/markets */
export async function createMarket(req: Request, res: Response, next: NextFunction) {
  const { name, symbol, logo_url, status } = req.body as {
    name: string; symbol: string; logo_url?: string; status?: MarketStatus;
  };
  try {
    const result = await pool.query<MarketRow>(
      `INSERT INTO markets (name, symbol, logo_url, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, String(symbol).toUpperCase(), logo_url || null, status || 'active']
    );
    sendSuccess(res, { market: result.rows[0] }, 201);
  } catch (err: any) {
    if (err.code === '23505') {
      sendError(res, 'A market with this symbol already exists', 409);
      return;
    }
    next(err);
  }
}

/** PATCH /api/v1/admin/markets/:id */
export async function updateMarket(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { name, symbol, logo_url, status } = req.body as {
    name?: string; symbol?: string; logo_url?: string; status?: MarketStatus;
  };

  try {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name); }
    if (symbol !== undefined) { sets.push(`symbol = $${idx++}`); params.push(String(symbol).toUpperCase()); }
    if (logo_url !== undefined) { sets.push(`logo_url = $${idx++}`); params.push(logo_url); }
    if (status !== undefined) { sets.push(`status = $${idx++}`); params.push(status); }

    if (sets.length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    params.push(id);
    const result = await pool.query<MarketRow>(
      `UPDATE markets SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
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

/** DELETE /api/v1/admin/markets/:id */
export async function deleteMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query(`DELETE FROM markets WHERE id = $1`, [req.params.id]);
    if (result.rowCount === 0) {
      sendError(res, 'Market not found', 404);
      return;
    }
    sendSuccess(res, { message: 'Market deleted' });
  } catch (err) {
    next(err);
  }
}

// ---- Listings --------------------------------------------------------------

/** GET /api/v1/admin/listings */
export async function listAllListings(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<ListingRow & { seller_username: string; market_name: string; market_symbol: string }>(`
      SELECT l.*, u.username AS seller_username, m.name AS market_name, m.symbol AS market_symbol
      FROM listings l
      JOIN users u ON u.id = l.seller_id
      JOIN markets m ON m.id = l.market_id
      ORDER BY l.created_at DESC
    `);
    sendSuccess(res, { listings: result.rows });
  } catch (err) {
    next(err);
  }
}

// ---- Reports --------------------------------------------------------------

/** GET /api/v1/admin/reports */
export async function listReports(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<ReportRow & { reporter_username: string; reported_username: string }>(`
      SELECT r.*, rep.username AS reporter_username, repu.username AS reported_username
      FROM reports r
      JOIN users rep ON rep.id = r.reporter_id
      JOIN users repu ON repu.id = r.reported_user_id
      ORDER BY r.created_at DESC
    `);

    const mapped = result.rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      reporter_username: r.reporter_username,
      reported_username: r.reported_username,
    }));

    sendSuccess(res, { reports: mapped });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/admin/reports/:id/status */
export async function updateReportStatus(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { status } = req.body as { status: ReportStatus };

  try {
    const resolvedAt = status === 'resolved' || status === 'dismissed' ? new Date() : null;
    const result = await pool.query<ReportRow>(
      `UPDATE reports SET status = $1, resolved_at = $2 WHERE id = $3 RETURNING *`,
      [status, resolvedAt, id]
    );
    if (result.rowCount === 0) {
      sendError(res, 'Report not found', 404);
      return;
    }
    sendSuccess(res, { report: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ---- Settings --------------------------------------------------------------

/** GET /api/v1/admin/settings */
export async function getSettings(_req: Request, res: Response) {
  sendSuccess(res, {
    settings: {
      platformName: 'ALTXC',
      maintenanceMode: false,
      registrationOpen: true,
      note: 'Settings are placeholder values for the MVP; persistence is not yet implemented.',
    },
  });
}