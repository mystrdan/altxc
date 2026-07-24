import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

/** Catches errors thrown/passed via next(err) in any route and returns a clean JSON error. */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('Unhandled error:', err);

  // Postgres unique_violation
  if (err?.code === '23505') {
    sendError(res, 'That value is already in use', 409);
    return;
  }

  sendError(res, 'Internal server error', 500);
}

/** Catches requests to unknown routes. */
export function notFoundHandler(req: Request, res: Response) {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}
