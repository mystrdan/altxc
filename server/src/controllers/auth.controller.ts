import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { generateRefreshToken, getRefreshTokenExpiry } from '../utils/refreshToken';
import { sendSuccess, sendError } from '../utils/apiResponse';

/** POST /api/v1/auth/register */
export async function register(req: Request, res: Response, next: NextFunction) {
  const { username, email, password } = req.body;

  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: 'insensitive' } },
          { email: { equals: email, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) {
      sendError(res, 'Username or email is already taken', 409);
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: 'user',
        profile: { create: {} },
      },
    });

    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    const refreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        refreshToken,
        expiresAt: getRefreshTokenExpiry(),
        userId: user.id,
      },
    });

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
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    const token = signToken({ userId: user.id, username: user.username, role: user.role });
    const refreshToken = generateRefreshToken();

    await prisma.session.create({
      data: {
        refreshToken,
        expiresAt: getRefreshTokenExpiry(),
        userId: user.id,
      },
    });

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
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      sendError(res, 'Invalid or expired refresh token', 401);
      return;
    }

    // Rotate the refresh token
    await prisma.session.delete({ where: { id: session.id } });

    const newRefreshToken = generateRefreshToken();
    await prisma.session.create({
      data: {
        refreshToken: newRefreshToken,
        expiresAt: getRefreshTokenExpiry(),
        userId: session.user.id,
      },
    });

    const token = signToken({
      userId: session.user.id,
      username: session.user.username,
      role: session.user.role,
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
      await prisma.session.deleteMany({ where: { refreshToken } });
    }
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/logout-all */
export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.session.deleteMany({ where: { userId: req.user!.userId } });
    sendSuccess(res, { message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/auth/me */
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, email: true, role: true, createdAt: true, lastSeenAt: true },
    });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, { user });
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