import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

// ─── Trade Requests ─────────────────────────────────────────────────────

/** POST /api/v1/trades/request - send a trade request */
export async function sendTradeRequest(req: Request, res: Response, next: NextFunction) {
  const { listingId, message } = req.body;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });

    if (!listing) {
      sendError(res, 'Listing not found', 404);
      return;
    }
    if (listing.sellerId === req.user!.userId) {
      sendError(res, 'You cannot request a trade on your own listing', 400);
      return;
    }
    if (listing.status !== 'open') {
      sendError(res, 'This listing is no longer open', 400);
      return;
    }

    // Check for existing pending request
    const existing = await prisma.tradeRequest.findFirst({
      where: {
        buyerId: req.user!.userId,
        listingId,
        status: 'pending',
      },
    });
    if (existing) {
      sendError(res, 'You already have a pending request for this listing', 409);
      return;
    }

    const tradeRequest = await prisma.tradeRequest.create({
      data: {
        buyerId: req.user!.userId,
        sellerId: listing.sellerId,
        listingId,
        message: message || '',
      },
      include: {
        buyer: { select: { id: true, username: true, role: true } },
        seller: { select: { id: true, username: true, role: true } },
        listing: {
          include: {
            market: { select: { id: true, name: true, symbol: true } },
          },
        },
      },
    });

    sendSuccess(res, { tradeRequest }, 201);
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/trades/requests - get trade requests (sent or received) */
export async function getTradeRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const { direction } = req.query; // 'sent' or 'received'

    let where: any = {};
    if (direction === 'sent') {
      where.buyerId = req.user!.userId;
    } else {
      where.sellerId = req.user!.userId;
    }

    const requests = await prisma.tradeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, username: true, role: true } },
        seller: { select: { id: true, username: true, role: true } },
        listing: {
          include: {
            market: { select: { id: true, name: true, symbol: true } },
          },
        },
      },
    });

    sendSuccess(res, { requests });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/trades/requests/:id - accept or decline a trade request */
export async function respondToTradeRequest(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { action } = req.body; // 'accepted' or 'declined'

  try {
    const tradeRequest = await prisma.tradeRequest.findUnique({
      where: { id },
      include: {
        listing: true,
        buyer: true,
      },
    });

    if (!tradeRequest) {
      sendError(res, 'Trade request not found', 404);
      return;
    }
    if (tradeRequest.sellerId !== req.user!.userId) {
      sendError(res, 'Only the seller can respond to this request', 403);
      return;
    }
    if (tradeRequest.status !== 'pending') {
      sendError(res, 'This request has already been responded to', 400);
      return;
    }

    if (action === 'accepted') {
      // Create a trade record
      const trade = await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.tradeRequest.update({
          where: { id },
          data: { status: 'accepted' },
        });

        // Close the listing
        await tx.listing.update({
          where: { id: tradeRequest.listingId },
          data: { status: 'closed' },
        });

        // Update buyer's profile to add this market
        const coinSymbol = tradeRequest.listing.coin;
        const buyerProfile = await tx.profile.findUnique({
          where: { userId: tradeRequest.buyerId },
        });
        if (buyerProfile && !buyerProfile.supportedMarkets.includes(coinSymbol)) {
          await tx.profile.update({
            where: { userId: tradeRequest.buyerId },
            data: { supportedMarkets: { push: [coinSymbol] } },
          });
        }

        // Create the trade
        const totalUsd = Number(tradeRequest.listing.amount) * Number(tradeRequest.listing.price);
        return tx.trade.create({
          data: {
            buyerId: tradeRequest.buyerId,
            sellerId: tradeRequest.sellerId,
            listingId: tradeRequest.listingId,
            amount: tradeRequest.listing.amount,
            price: tradeRequest.listing.price,
            totalUsd,
            coin: tradeRequest.listing.coin,
            status: 'pending',
          },
          include: {
            buyer: { select: { id: true, username: true } },
            seller: { select: { id: true, username: true } },
            listing: {
              include: {
                market: { select: { id: true, name: true, symbol: true } },
              },
            },
          },
        });
      });

      sendSuccess(res, { trade, message: 'Trade request accepted. Trade room created.' });
    } else if (action === 'declined') {
      const updated = await prisma.tradeRequest.update({
        where: { id },
        data: { status: 'declined' },
      });
      sendSuccess(res, { tradeRequest: updated, message: 'Trade request declined' });
    } else {
      sendError(res, 'Action must be "accepted" or "declined"', 400);
    }
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/trades/requests/:id/cancel - cancel a trade request (buyer only) */
export async function cancelTradeRequest(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;

  try {
    const tradeRequest = await prisma.tradeRequest.findUnique({ where: { id } });
    if (!tradeRequest) {
      sendError(res, 'Trade request not found', 404);
      return;
    }
    if (tradeRequest.buyerId !== req.user!.userId) {
      sendError(res, 'Only the buyer can cancel this request', 403);
      return;
    }
    if (tradeRequest.status !== 'pending') {
      sendError(res, 'This request can no longer be cancelled', 400);
      return;
    }

    const updated = await prisma.tradeRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    sendSuccess(res, { tradeRequest: updated });
  } catch (err) {
    next(err);
  }
}

// ─── Trades / Trade Room ────────────────────────────────────────────────

/** GET /api/v1/trades - get user's trades */
export async function getMyTrades(req: Request, res: Response, next: NextFunction) {
  try {
    const trades = await prisma.trade.findMany({
      where: {
        OR: [
          { buyerId: req.user!.userId },
          { sellerId: req.user!.userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true } },
        listing: {
          select: { id: true, type: true, coin: true, amount: true, price: true },
        },
        _count: { select: { messages: true } },
      },
    });

    sendSuccess(res, { trades });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/trades/:id - get trade room details */
export async function getTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const trade = await prisma.trade.findUnique({
      where: { id: req.params.id },
      include: {
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true } },
        listing: {
          include: {
            market: { select: { id: true, name: true, symbol: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, username: true } },
          },
        },
      },
    });

    if (!trade) {
      sendError(res, 'Trade not found', 404);
      return;
    }

    // Verify user is part of this trade
    if (trade.buyerId !== req.user!.userId && trade.sellerId !== req.user!.userId) {
      sendError(res, 'Access denied', 403);
      return;
    }

    sendSuccess(res, { trade });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/trades/:id/messages - send a message in a trade room */
export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const trade = await prisma.trade.findUnique({ where: { id } });
    if (!trade) {
      sendError(res, 'Trade not found', 404);
      return;
    }
    if (trade.buyerId !== req.user!.userId && trade.sellerId !== req.user!.userId) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user!.userId,
        tradeId: id,
      },
      include: {
        sender: { select: { id: true, username: true } },
      },
    });

    sendSuccess(res, { message }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/trades/:id/status - update trade status */
export async function updateTradeStatus(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const trade = await prisma.trade.findUnique({ where: { id } });
    if (!trade) {
      sendError(res, 'Trade not found', 404);
      return;
    }
    if (trade.buyerId !== req.user!.userId && trade.sellerId !== req.user!.userId) {
      sendError(res, 'Access denied', 403);
      return;
    }

    const validTransitions: Record<string, string[]> = {
      pending: ['in_escrow', 'cancelled'],
      in_escrow: ['completed', 'disputed'],
      completed: [],
      cancelled: [],
      disputed: [],
    };

    const allowed = validTransitions[trade.status] || [];
    if (!allowed.includes(status)) {
      sendError(res, `Cannot transition from ${trade.status} to ${status}`, 400);
      return;
    }

    const updated = await prisma.trade.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      },
    });

    // Update trade counts on profiles if completed
    if (status === 'completed') {
      await prisma.profile.updateMany({
        where: { userId: { in: [trade.buyerId, trade.sellerId] } },
        data: { completedTrades: { increment: 1 } },
      });
    }

    sendSuccess(res, { trade: updated });
  } catch (err) {
    next(err);
  }
}