import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { UserRow } from '../types';

/** POST /api/v1/register */
export async function register(req: Request, res: Response, next: NextFunction) {
  const { username, email, password } = req.body;

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [username, email]
    );
    if (existing.rows.length > 0) {
      sendError(res, 'Username or email is already taken', 409);
      return;
    }

    const passwordHash = await hashPassword(password);

    const userResult = await pool.query<UserRow>(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, username, email, role, created_at, last_seen_at`,
      [username, email, passwordHash]
    );
    const user = userResult.rows[0];

    // Every user gets a blank profile row created alongside their account.
    await pool.query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);

    const token = signToken({ userId: user.id, username: user.username, role: user.role });

    sendSuccess(
      res,
      {
        token,
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

/** POST /api/v1/login */
export async function login(req: Request, res: Response, next: NextFunction) {
  const { identifier, password } = req.body;

  try {
    const result = await pool.query<UserRow>(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [identifier]
    );
    const user = result.rows[0];

    // Same generic error whether the user doesn't exist or the password is
    // wrong, to avoid leaking which usernames/emails are registered.
    if (!user) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    await pool.query('UPDATE users SET last_seen_at = now() WHERE id = $1', [user.id]);

    const token = signToken({ userId: user.id, username: user.username, role: user.role });

    sendSuccess(res, {
      token,
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

/**
 * POST /api/v1/logout
 * JWTs are stateless, so "logout" is handled by the client discarding the
 * token. This endpoint exists for a consistent API contract and as a place
 * to plug in token-blocklisting later if needed.
 */
export async function logout(_req: Request, res: Response) {
  sendSuccess(res, { message: 'Logged out successfully' });
}

/** GET /api/v1/me - returns the currently authenticated user (used by ProtectedRoute/dashboard) */
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query<UserRow>(
      'SELECT id, username, email, role, created_at, last_seen_at FROM users WHERE id = $1',
      [req.user!.userId]
    );
    const user = result.rows[0];
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
