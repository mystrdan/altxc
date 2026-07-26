import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { generateRefreshToken, getRefreshTokenExpiry } from '../utils/refreshToken';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { UserRow, SessionRow } from '../types';

/** POST /api/v1/auth/register */
export async function register(req: Request, res: Response, next: NextFunction) {
  const { username, email, password } = req.body;

  try {
    const existing = await pool.query<UserRow>(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1`,
      [username, email]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      sendError(res, 'Username or email is already taken', 409);
      return;
    }

    const passwordHash = await hashPassword(password);

    const userResult = await pool.query<UserRow>(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
      [username, email, passwordHash]
    );
    const user = userResult.rows[0];

    // Create profile
    await pool.query(
      `INSERT INTO profiles (user_id) VALUES ($1)`,
      [user.id]
    );

    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    const refreshToken = generateRefreshToken();

    await pool.query(
      `INSERT INTO sessions (refresh_token, expires_at, user_id) VALUES ($1, $2, $3)`,
      [refreshToken, getRefreshTokenExpiry(), user.id]
    );

    sendSuccess(
      res,
      {
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/login */
export async function login(req: Request, res: Response, next: NextFunction) {
  const { identifier, password } = req.body;

  try {
    const userResult = await pool.query<UserRow>(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1`,
      [identifier]
    );

    if (userResult.rowCount === 0) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const user = userResult.rows[0];

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    await pool.query(
      `UPDATE users SET last_seen_at = now() WHERE id = $1`,
      [user.id]
    );

    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    const refreshToken = generateRefreshToken();

    await pool.query(
      `INSERT INTO sessions (refresh_token, expires_at, user_id) VALUES ($1, $2, $3)`,
      [refreshToken, getRefreshTokenExpiry(), user.id]
    );

    sendSuccess(res, {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/refresh */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  const { refreshToken } = req.body;

  try {
    const sessionResult = await pool.query<SessionRow & { username: string; role: string }>(
      `SELECT s.*, u.username, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.refresh_token = $1
       LIMIT 1`,
      [refreshToken]
    );

    if (sessionResult.rowCount === 0) {
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    const session = sessionResult.rows[0];

    if (new Date(session.expires_at) < new Date()) {
      await pool.query(`DELETE FROM sessions WHERE id = $1`, [session.id]);
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    // Rotate the refresh token
    await pool.query(`DELETE FROM sessions WHERE id = $1`, [session.id]);

    const newRefreshToken = generateRefreshToken();
    await pool.query(
      `INSERT INTO sessions (refresh_token, expires_at, user_id) VALUES ($1, $2, $3)`,
      [newRefreshToken, getRefreshTokenExpiry(), session.user_id]
    );

    const token = signToken({
      userId: session.user_id,
      username: session.username,
      role: session.role as any,
    });

    sendSuccess(res, {
      token,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/logout */
export async function logout(req: Request, res: Response, next: NextFunction) {
  const { refreshToken } = req.body;
  try {
    if (refreshToken) {
      await pool.query(`DELETE FROM sessions WHERE refresh_token = $1`, [refreshToken]);
    }
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/logout-all */
export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [req.user!.userId]);
    sendSuccess(res, { message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/auth/me */
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<UserRow>(
      `SELECT id, username, email, role, created_at, last_seen_at FROM users WHERE id = $1`,
      [req.user!.userId]
    );
    if (result.rowCount === 0) {
      sendError(res, 'User not found', 404);
      return;
    }
    const u = result.rows[0];
    sendSuccess(res, {
      user: {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
        lastSeenAt: u.last_seen_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/forgot-password - skeleton only, no email sending */
export async function forgotPassword(_req: Request, res: Response) {
  sendSuccess(res, {
    message: 'If an account with that email exists, a password reset link has been sent.',
    note: 'Password reset emails are not yet implemented. This is a placeholder endpoint.',
  });
}

/** POST /api/v1/auth/reset-password - skeleton only */
export async function resetPassword(_req: Request, res: Response) {
  sendSuccess(res, {
    message: 'Password reset is not yet implemented. This is a placeholder endpoint.',
  });
}