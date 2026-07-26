import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { UserRow, ProfileRow } from '../types';

/** GET /api/v1/profile/:username - public profile data */
export async function getProfileByUsername(req: Request, res: Response, next: NextFunction) {
  const { username } = req.params;

  try {
    const result = await pool.query<UserRow & ProfileRow>(`
      SELECT u.username, u.role, u.created_at, u.last_seen_at,
             p.display_name, p.trust_score, p.completed_trades, p.trade_volume_usd,
             p.supported_markets, p.bio
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE LOWER(u.username) = LOWER($1)
      LIMIT 1
    `, [username]);

    if (result.rowCount === 0) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    const row = result.rows[0];

    const profile = {
      username: row.username,
      displayName: row.display_name,
      status: row.role,
      joinDate: row.created_at,
      lastSeen: row.last_seen_at,
      trustScore: row.trust_score,
      completedTrades: row.completed_trades,
      tradeVolumeUsd: row.trade_volume_usd,
      supportedMarkets: row.supported_markets,
      bio: row.bio,
    };

    sendSuccess(res, { profile });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/dashboard - authenticated user's own dashboard summary */
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userResult = await pool.query<UserRow & ProfileRow>(`
      SELECT u.*, p.*
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `, [req.user!.userId]);

    if (userResult.rowCount === 0) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    const row = userResult.rows[0];

    const profile = {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      status: row.role,
      joinDate: row.created_at,
      lastSeen: row.last_seen_at,
      trustScore: row.trust_score,
      completedTrades: row.completed_trades,
      tradeVolumeUsd: row.trade_volume_usd,
      supportedMarkets: row.supported_markets,
      bio: row.bio,
    };

    // Get counts
    const [listingsCount, pendingCount, sentCount] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS cnt FROM listings WHERE seller_id = $1`, [req.user!.userId]),
      pool.query(`SELECT COUNT(*) AS cnt FROM trade_requests WHERE seller_id = $1 AND status = 'pending'`, [req.user!.userId]),
      pool.query(`SELECT COUNT(*) AS cnt FROM trade_requests WHERE buyer_id = $1`, [req.user!.userId]),
    ]);

    const myListingsCount = parseInt(listingsCount.rows[0].cnt, 10);
    const pendingRequestsCount = parseInt(pendingCount.rows[0].cnt, 10);
    const sentRequestsCount = parseInt(sentCount.rows[0].cnt, 10);

    // Recent activity
    const recentActivity = [
      { type: 'account', message: 'Account created', timestamp: row.created_at },
      { type: 'session', message: 'Last login', timestamp: row.last_seen_at },
    ];

    sendSuccess(res, {
      profile,
      accountStatus: row.role === 'admin' ? 'Administrator' : 'Active',
      myListingsCount,
      pendingRequestsCount,
      sentRequestsCount,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/profile - update own profile */
export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  const { displayName, bio, supportedMarkets } = req.body;

  try {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (displayName !== undefined) { sets.push(`display_name = $${idx++}`); params.push(displayName); }
    if (bio !== undefined) { sets.push(`bio = $${idx++}`); params.push(bio); }
    if (supportedMarkets !== undefined) { sets.push(`supported_markets = $${idx++}`); params.push(supportedMarkets); }

    if (sets.length === 0) {
      sendError(res, 'No fields to update', 400);
      return;
    }

    params.push(req.user!.userId);
    const result = await pool.query<ProfileRow>(
      `UPDATE profiles SET ${sets.join(', ')}, updated_at = now() WHERE user_id = $${idx} RETURNING *`,
      params
    );

    sendSuccess(res, { profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/reports - authenticated user reports another user */
export async function createReport(req: Request, res: Response, next: NextFunction) {
  const { reportedUsername, reason } = req.body;

  try {
    const reportedResult = await pool.query<UserRow>(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [reportedUsername]
    );

    if (reportedResult.rowCount === 0) {
      sendError(res, 'Reported user not found', 404);
      return;
    }

    const reportedUser = reportedResult.rows[0];

    if (reportedUser.id === req.user!.userId) {
      sendError(res, 'You cannot report yourself', 400);
      return;
    }

    const reportResult = await pool.query(
      `INSERT INTO reports (reporter_id, reported_user_id, reason) VALUES ($1, $2, $3) RETURNING *`,
      [req.user!.userId, reportedUser.id, reason]
    );

    sendSuccess(res, { report: reportResult.rows[0] }, 201);
  } catch (err) {
    next(err);
  }
}