import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/apiResponse';

// ---- Users --------------------------------------------------------------

/** GET /api/v1/admin/users */
export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at, u.last_seen_at,
              p.trust_score, p.completed_trades
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    sendSuccess(res, { users: result.rows });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/admin/users/:id/role */
export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
      [role, id]
    );
    if (result.rows.length === 0) {
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
  const { name, symbol, logo_url, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO markets (name, symbol, logo_url, status)
       VALUES ($1, $2, $3, COALESCE($4, 'active'))
       RETURNING id, name, symbol, logo_url, status, created_at`,
      [name, symbol, logo_url ?? null, status ?? null]
    );
    sendSuccess(res, { market: result.rows[0] }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/admin/markets/:id */
export async function updateMarket(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { name, symbol, logo_url, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE markets SET
         name = COALESCE($1, name),
         symbol = COALESCE($2, symbol),
         logo_url = COALESCE($3, logo_url),
         status = COALESCE($4, status)
       WHERE id = $5
       RETURNING id, name, symbol, logo_url, status, created_at`,
      [name ?? null, symbol ?? null, logo_url ?? null, status ?? null, id]
    );
    if (result.rows.length === 0) {
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
    const result = await pool.query('DELETE FROM markets WHERE id = $1 RETURNING id', [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      sendError(res, 'Market not found', 404);
      return;
    }
    sendSuccess(res, { message: 'Market deleted' });
  } catch (err) {
    next(err);
  }
}

// ---- Reports --------------------------------------------------------------

/** GET /api/v1/admin/reports */
export async function listReports(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query(
      `SELECT r.id, r.reason, r.status, r.created_at, r.resolved_at,
              reporter.username AS reporter_username,
              reported.username AS reported_username
       FROM reports r
       JOIN users reporter ON reporter.id = r.reporter_id
       JOIN users reported ON reported.id = r.reported_user_id
       ORDER BY r.created_at DESC`
    );
    sendSuccess(res, { reports: result.rows });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/admin/reports/:id/status */
export async function updateReportStatus(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const resolvedAt = status === 'resolved' || status === 'dismissed' ? 'now()' : 'NULL';
    const result = await pool.query(
      `UPDATE reports SET status = $1, resolved_at = ${resolvedAt} WHERE id = $2
       RETURNING id, reason, status, created_at, resolved_at`,
      [status, id]
    );
    if (result.rows.length === 0) {
      sendError(res, 'Report not found', 404);
      return;
    }
    sendSuccess(res, { report: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// ---- Settings --------------------------------------------------------------
// No settings table in the MVP schema; this is a placeholder endpoint so the
// admin UI and API contract exist ahead of a real settings table/feature.

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
