import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
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
  // Zod validation errors → 422 Unprocessable Entity
  if (err instanceof ZodError) {
    res.status(422).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.flatten(),
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_SERVER_ERROR';

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    code,
    message: err.message ?? 'An unexpected error occurred',
  });
}

/**
 * Helper to create a typed application error.
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
