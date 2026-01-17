import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { sendError, sendValidationError, sendInternalError } from '../utils/response';
import { ZodError } from 'zod';

// Custom error class for application errors
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions
export const createBadRequestError = (message: string, details?: unknown) =>
  new AppError(message, 400, 'BAD_REQUEST', details);

export const createUnauthorizedError = (message: string = 'Unauthorized') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const createForbiddenError = (message: string = 'Forbidden') =>
  new AppError(message, 403, 'FORBIDDEN');

export const createNotFoundError = (resource: string = 'Resource') =>
  new AppError(`${resource} not found`, 404, 'NOT_FOUND');

export const createConflictError = (message: string) =>
  new AppError(message, 409, 'CONFLICT');

export const createRateLimitError = (message: string = 'Rate limit exceeded') =>
  new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');

// Database error handler
function handleDatabaseError(err: Error & { code?: string }): AppError {
  // PostgreSQL error codes
  switch (err.code) {
    case '23505': // unique_violation
      return new AppError('Resource already exists', 409, 'DUPLICATE_ENTRY');
    case '23503': // foreign_key_violation
      return new AppError('Referenced resource not found', 400, 'FOREIGN_KEY_VIOLATION');
    case '23502': // not_null_violation
      return new AppError('Required field is missing', 400, 'REQUIRED_FIELD_MISSING');
    case '22P02': // invalid_text_representation
      return new AppError('Invalid input format', 400, 'INVALID_FORMAT');
    case '42501': // insufficient_privilege
      return new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    default:
      return new AppError('Database error', 500, 'DATABASE_ERROR');
  }
}

// Zod validation error handler
function handleZodError(err: ZodError): { field: string; message: string }[] {
  return err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
}

// Main error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    userId: (req as any).user?.id,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = handleZodError(err);
    return sendValidationError(res, validationErrors);
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle database errors (Supabase/PostgreSQL)
  if ((err as any).code && typeof (err as any).code === 'string') {
    const dbError = handleDatabaseError(err as Error & { code: string });
    return sendError(res, dbError.message, dbError.statusCode, dbError.code);
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 'Invalid JSON in request body', 400, 'INVALID_JSON');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Default to internal server error
  // Don't expose internal error details in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  return sendInternalError(res, message);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(
    res,
    `Cannot ${req.method} ${req.path}`,
    404,
    'NOT_FOUND'
  );
}

// Async handler wrapper to catch async errors
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
