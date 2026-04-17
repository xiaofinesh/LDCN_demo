/**
 * Zod-based request body validator helper.
 * Usage: validate(schema)(req.body) → data | throws APIError with 400 status.
 */
import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodType } from 'zod';

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Middleware factory: validates req.body against schema, replaces req.body with parsed value */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body ?? {});
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        next(new ApiError(400, '请求参数不合法', e.flatten().fieldErrors));
      } else {
        next(e);
      }
    }
  };
}

/** Middleware factory: validates req.query against schema */
export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query ?? {});
      (req as unknown as { validatedQuery: T }).validatedQuery = parsed;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        next(new ApiError(400, '查询参数不合法', e.flatten().fieldErrors));
      } else {
        next(e);
      }
    }
  };
}
