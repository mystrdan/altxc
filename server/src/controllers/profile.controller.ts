import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

/** GET /api/v1/profile/:username - public profile data */
export async function getProfileByUsername(req: Request, res: Response, next: NextFunction) {
  const { username } = req.params;

  try {
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      include: {
        profile: true,
      },
    });

    if (!user || !user.profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    const profile = {
      username: user.username,
      displayName: user.profile.displayName,
      status: user.role,
      joinDate: user.createdAt,
      lastSeen: user.lastSeenAt,
      trustScore: user.profile.trustScore,
      completedTrades: user.profile.completedTrades,
      tradeVolumeUsd: user.profile.tradeVolumeUsd,
      supportedMarkets: user.profile.supportedMarkets,
      bio: user.profile.bio,
    };

    sendSuccess(res, { profile });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/dashboard - authenticated user's own dashboard summary */
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }

    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.profile.displayName,
      status: user.role,
      joinDate: user.createdAt,
      lastSeen: user.lastSeenAt,
      trustScore: user.profile.trustScore,
      completedTrades: user.profile.completedTrades,
      tradeVolumeUsd: user.profile.tradeVolumeUsd,
      supportedMarkets: user.profile.supportedMarkets,
      bio: user.profile.bio,
    };

    // Get my listings count
    const myListingsCount = await prisma.listing.count({
      where: { sellerId: user.id },
    });

    // Get pending trade requests count
    const pendingRequestsCount = await prisma.tradeRequest.count({
      where: { sellerId: user.id, status: 'pending' },
    });

    // Get sent trade requests count
    const sentRequestsCount = await prisma.tradeRequest.count({
      where: { buyerId: user.id },
    });

    // Recent activity
    const recentActivity = [
      { type: 'account', message: 'Account created', timestamp: user.createdAt },
      { type: 'session', message: 'Last login', timestamp: user.lastSeenAt },
    ];

    sendSuccess(res, {
      profile,
      accountStatus: user.role === 'admin' ? 'Administrator' : 'Active',
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
    const profile = await prisma.profile.update({
      where: { userId: req.user!.userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(supportedMarkets !== undefined && { supportedMarkets }),
      },
    });

    sendSuccess(res, { profile });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/reports - authenticated user reports another user */
export async function createReport(req: Request, res: Response, next: NextFunction) {
  const { reportedUsername, reason } = req.body;

  try {
    const reportedUser = await prisma.user.findFirst({
      where: { username: { equals: reportedUsername, mode: 'insensitive' } },
    });

    if (!reportedUser) {
      sendError(res, 'Reported user not found', 404);
      return;
    }

    if (reportedUser.id === req.user!.userId) {
      sendError(res, 'You cannot report yourself', 400);
      return;
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user!.userId,
        reportedUserId: reportedUser.id,
        reason,
      },
    });

    sendSuccess(res, { report }, 201);
  } catch (err) {
    next(err);
  }
}