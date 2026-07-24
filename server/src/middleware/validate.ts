import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/apiResponse';

/**
 * Validates req.body against a zod schema. On success, replaces req.body
 * with the parsed (and possibly transformed, e.g. lowercased) value.
 */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      sendError(res, 'Validation failed', 422, details);
      return;
    }
    req.body = result.data;
    next();
  };
}
