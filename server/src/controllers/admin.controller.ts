import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

// ---- Users --------------------------------------------------------------

/** GET /api/v1/admin/users */
export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        profile: {
          select: { trustScore: true, completedTrades: true, tradeVolumeUsd: true },
        },
      },
    });

    const mapped = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastSeenAt: u.lastSeenAt,
      trustScore: u.profile?.trustScore || 0,
      completedTrades: u.profile?.completedTrades || 0,
    }));

    sendSuccess(res, { users: mapped });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/admin/users/:id/role */
export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, role: true },
    });
    sendSuccess(res, { user });
  } catch (err: any) {
    if (err.code === 'P2025') {
      sendError(res, 'User not found', 404);
      return;
    }
    next(err);
  }
}

// ---- Markets --------------------------------------------------------------

/** POST /api/v1/admin/markets */
export async function createMarket(req: Request, res: Response, next: NextFunction) {
  const { name, symbol, logo_url, status } = req.body;
  try {
    const market = await prisma.market.create({
      data: {
        name,
        symbol: String(symbol).toUpperCase(),
        logoUrl: logo_url || null,
        status: status || 'active',
      },
    });
    sendSuccess(res, { market }, 201);
  } catch (err: any) {
    if (err.code === 'P2002') {
      sendError(res, 'A market with this symbol already exists', 409);
      return;
    }
    next(err);
  }
}

/** PATCH /api/v1/admin/markets/:id */
export async function updateMarket(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { name, symbol, logo_url, status } = req.body;

  try {
    const market = await prisma.market.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(symbol !== undefined && { symbol: String(symbol).toUpperCase() }),
        ...(logo_url !== undefined && { logoUrl: logo_url }),
        ...(status !== undefined && { status }),
      },
    });
    sendSuccess(res, { market });
  } catch (err: any) {
    if (err.code === 'P2025') {
      sendError(res, 'Market not found', 404);
      return;
    }
    next(err);
  }
}

/** DELETE /api/v1/admin/markets/:id */
export async function deleteMarket(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.market.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: 'Market deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      sendError(res, 'Market not found', 404);
      return;
    }
    next(err);
  }
}

// ---- Listings --------------------------------------------------------------

/** GET /api/v1/admin/listings */
export async function listAllListings(_req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await prisma.listing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { id: true, username: true } },
        market: { select: { id: true, name: true, symbol: true } },
      },
    });
    sendSuccess(res, { listings });
  } catch (err) {
    next(err);
  }
}

// ---- Reports --------------------------------------------------------------

/** GET /api/v1/admin/reports */
export async function listReports(_req: Request, res: Response, next: NextFunction) {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { username: true } },
        reportedUser: { select: { username: true } },
      },
    });

    const mapped = reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      reporter_username: r.reporter.username,
      reported_username: r.reportedUser.username,
    }));

    sendSuccess(res, { reports: mapped });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/admin/reports/:id/status */
export async function updateReportStatus(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const resolvedAt = status === 'resolved' || status === 'dismissed' ? new Date() : null;
    const report = await prisma.report.update({
      where: { id },
      data: { status, resolvedAt },
    });
    sendSuccess(res, { report });
  } catch (err: any) {
    if (err.code === 'P2025') {
      sendError(res, 'Report not found', 404);
      return;
    }
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