import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/apiResponse';

/** GET /api/v1/profile/:username - public profile data */
export async function getProfileByUsername(req: Request, res: Response, next: NextFunction) {
  const { username } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         u.username,
         u.role AS status,
         u.created_at AS join_date,
         u.last_seen_at AS last_seen,
         p.trust_score,
         p.completed_trades,
         p.trade_volume_usd,
         p.supported_markets,
         p.bio
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE LOWER(u.username) = LOWER($1)`,
      [username]
    );

    const profile = result.rows[0];
    if (!profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    sendSuccess(res, { profile });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/dashboard - authenticated user's own dashboard summary */
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.username, u.email, u.role, u.created_at AS join_date, u.last_seen_at AS last_seen,
         p.trust_score, p.completed_trades, p.trade_volume_usd, p.supported_markets, p.bio
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );

    const profile = result.rows[0];
    if (!profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    // Recent activity has no backing table yet (no trades/escrow in the MVP),
    // so we return a static placeholder list. Replace with a real
    // `activity` table once trading/escrow features exist.
    const recentActivity = [
      { type: 'account', message: 'Account created', timestamp: profile.join_date },
      { type: 'session', message: 'Last login', timestamp: profile.last_seen },
    ];

    sendSuccess(res, {
      profile,
      accountStatus: profile.role === 'admin' ? 'Administrator' : 'Active',
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/reports - authenticated user reports another user */
export async function createReport(req: Request, res: Response, next: NextFunction) {
  const { reportedUsername, reason } = req.body;

  try {
    const reportedUser = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [
      reportedUsername,
    ]);

    if (reportedUser.rows.length === 0) {
      sendError(res, 'Reported user not found', 404);
      return;
    }

    const reportedUserId = reportedUser.rows[0].id;

    if (reportedUserId === req.user!.userId) {
      sendError(res, 'You cannot report yourself', 400);
      return;
    }

    const result = await pool.query(
      `INSERT INTO reports (reporter_id, reported_user_id, reason)
       VALUES ($1, $2, $3)
       RETURNING id, reason, status, created_at`,
      [req.user!.userId, reportedUserId, reason]
    );

    sendSuccess(res, { report: result.rows[0] }, 201);
  } catch (err) {
    next(err);
  }
}
