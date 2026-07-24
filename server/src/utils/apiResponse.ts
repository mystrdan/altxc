import { Response } from 'express';
import { ApiSuccess, ApiError } from '../types';

/** Sends a consistent success envelope: { success: true, data } */
export function sendSuccess<T>(res: Response, data: T, status = 200): Response<ApiSuccess<T>> {
  return res.status(status).json({ success: true, data });
}

/** Sends a consistent error envelope: { success: false, error: { message, details? } } */
export function sendError(
  res: Response,
  message: string,
  status = 400,
  details?: unknown
): Response<ApiError> {
  return res.status(status).json({
    success: false,
    error: { message, ...(details !== undefined ? { details } : {}) },
  });
}
