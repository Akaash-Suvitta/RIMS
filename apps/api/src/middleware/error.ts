import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../lib/config.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  limit?: string;
  current?: string;
  fields?: Record<string, string>;
}

/**
 * Global Express error handler middleware.
 * Must be registered LAST in the Express app (after all routes).
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Zod validation errors → 400 Bad Request
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const fieldPath = issue.path.join('.');
      fieldErrors[fieldPath || '_'] = issue.message;
    }
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      details: fieldErrors,
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';

  // Log server errors — never send stack traces to clients in demo/production
  if (statusCode >= 500) {
    console.error('[error]', err.message, env.isLocal ? err.stack : '');
  }

  // Demo limit errors → include limit/current details
  if (code === 'DEMO_LIMIT_EXCEEDED') {
    res.status(402).json({
      code,
      message: err.message ?? 'Demo limit exceeded.',
      details: {
        limit: err.limit,
        current: err.current,
      },
    });
    return;
  }

  res.status(statusCode).json({
    code,
    message:
      statusCode >= 500 && !env.isLocal
        ? 'An unexpected error occurred.'
        : (err.message ?? 'An unexpected error occurred.'),
  });
}

/**
 * Helper to create a typed application error that the global error handler
 * will translate into the correct HTTP status and code.
 */
export function createError(
  message: string,
  statusCode: number,
  code?: string,
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code ?? 'APP_ERROR';
  return error;
}

/** Convenience factories matching the error classes in the design doc. */
export const Errors = {
  notFound: (msg: string) => createError(msg, 404, 'NOT_FOUND'),
  unauthorized: (msg: string) => createError(msg, 401, 'UNAUTHORIZED'),
  forbidden: (msg: string) => createError(msg, 403, 'FORBIDDEN'),
  conflict: (msg: string) => createError(msg, 409, 'CONFLICT'),
  unprocessable: (msg: string) => createError(msg, 422, 'UNPROCESSABLE'),
  badRequest: (msg: string) => createError(msg, 400, 'BAD_REQUEST'),
  demoLimit: (msg: string, limit: string, current: string) => {
    const err = createError(msg, 402, 'DEMO_LIMIT_EXCEEDED') as AppError;
    err.limit = limit;
    err.current = current;
    return err;
  },
};
