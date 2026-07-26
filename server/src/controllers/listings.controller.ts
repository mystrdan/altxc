import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

/** GET /api/v1/listings - list all open listings with filters */
export async function listListings(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, coin, marketId, status, sellerId, sort } = req.query;

    const where: any = {};
    if (type) where.type = String(type).toUpperCase();
    if (coin) where.coin = { equals: String(coin), mode: 'insensitive' };
    if (marketId) where.marketId = String(marketId);
    if (status) where.status = String(status).toUpperCase();
    if (sellerId) where.sellerId = String(sellerId);

    const orderBy: any = {};
    if (sort === 'oldest') orderBy.createdAt = 'asc';
    else if (sort === 'price_asc') orderBy.price = 'asc';
    else if (sort === 'price_desc') orderBy.price = 'desc';
    else orderBy.createdAt = 'desc';

    const listings = await prisma.listing.findMany({
      where,
      orderBy,
      include: {
        seller: {
          select: { id: true, username: true, role: true },
        },
        market: {
          select: { id: true, name: true, symbol: true },
        },
        _count: {
          select: { tradeRequests: true },
        },
      },
    });

    sendSuccess(res, { listings });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/listings/:id - single listing detail */
export async function getListing(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        seller: {
          select: { id: true, username: true, role: true },
        },
        market: {
          select: { id: true, name: true, symbol: true },
        },
      },
    });

    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }

    sendSuccess(res, { listing });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/listings - create a new listing */
export async function createListing(req: Request, res: Response, next: NextFunction) {
  const { type, coin, amount, price, marketId } = req.body;

  try {
    // Verify market exists
    const market = await prisma.market.findUnique({ where: { id: marketId } });
    if (!market) {
      sendError(res, 'Market not found', 404);
      return;
    }

    const listing = await prisma.listing.create({
      data: {
        type: String(type).toUpperCase() as any,
        coin: String(coin).toUpperCase(),
        amount,
        price,
        paymentCurrency: 'USDT',
        sellerId: req.user!.userId,
        marketId,
      },
      include: {
        seller: {
          select: { id: true, username: true, role: true },
        },
        market: {
          select: { id: true, name: true, symbol: true },
        },
      },
    });

    sendSuccess(res, { listing }, 201);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/listings/:id - update a listing (owner only) */
export async function updateListing(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { type, coin, amount, price, status } = req.body;

  try {
    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Listing not found', 404);
      return;
    }
    if (existing.sellerId !== req.user!.userId) {
      sendError(res, 'You can only edit your own listings', 403);
      return;
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        ...(type !== undefined && { type: String(type).toUpperCase() as any }),
        ...(coin !== undefined && { coin: String(coin).toUpperCase() }),
        ...(amount !== undefined && { amount }),
        ...(price !== undefined && { price }),
        ...(status !== undefined && { status: String(status).toUpperCase() as any }),
      },
      include: {
        seller: { select: { id: true, username: true, role: true } },
        market: { select: { id: true, name: true, symbol: true } },
      },
    });

    sendSuccess(res, { listing });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/listings/:id - close/delete a listing (owner only) */
export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;

  try {
    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Listing not found', 404);
      return;
    }
    if (existing.sellerId !== req.user!.userId) {
      sendError(res, 'You can only delete your own listings', 403);
      return;
    }

    await prisma.listing.update({
      where: { id },
      data: { status: 'closed' },
    });

    sendSuccess(res, { message: 'Listing closed' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/listings/my - get current user's listings */
export async function getMyListings(req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        market: { select: { id: true, name: true, symbol: true } },
        _count: { select: { tradeRequests: true } },
      },
    });

    sendSuccess(res, { listings });
  } catch (err) {
    next(err);
  }
}