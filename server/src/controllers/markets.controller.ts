import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

/** GET /api/v1/markets - list all markets with stats (public) */
export async function listMarkets(_req: Request, res: Response, next: NextFunction) {
  try {
    const markets = await prisma.market.findMany({
      orderBy: { symbol: 'asc' },
      include: {
        _count: {
          select: { listings: true },
        },
      },
    });

    // Enrich with buyer/seller counts and average rating
    const enriched = await Promise.all(
      markets.map(async (market) => {
        const activeListings = await prisma.listing.findMany({
          where: { marketId: market.id, status: 'open' },
          select: { type: true, sellerId: true },
        });

        const buyerCount = activeListings.filter((l) => l.type === 'buy').length;
        const sellerCount = activeListings.filter((l) => l.type === 'sell').length;

        // Average merchant rating (from profiles of users with listings in this market)
        const sellerIds = [...new Set(activeListings.map((l) => l.sellerId))];
        let avgRating = null;
        if (sellerIds.length > 0) {
          const profiles = await prisma.profile.findMany({
            where: { userId: { in: sellerIds } },
            select: { trustScore: true },
          });
          const total = profiles.reduce((sum, p) => sum + Number(p.trustScore), 0);
          avgRating = profiles.length > 0 ? total / profiles.length : null;
        }

        return {
          id: market.id,
          name: market.name,
          symbol: market.symbol,
          logoUrl: market.logoUrl,
          status: market.status,
          activeListings: market._count.listings,
          buyerCount,
          sellerCount,
          avgMerchantRating: avgRating ? Math.round(avgRating * 100) / 100 : null,
          createdAt: market.createdAt,
        };
      })
    );

    sendSuccess(res, { markets: enriched });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/markets/:symbol - single market detail (public) */
export async function getMarket(req: Request, res: Response, next: NextFunction) {
  try {
    const market = await prisma.market.findFirst({
      where: { symbol: { equals: req.params.symbol, mode: 'insensitive' } },
    });

    if (!market) {
      sendError(res, 'Market not found', 404);
      return;
    }

    sendSuccess(res, { market });
  } catch (err) {
    next(err);
  }
}