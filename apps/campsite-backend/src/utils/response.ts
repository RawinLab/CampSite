import { Response } from 'express';

// Standard API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination info
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
}

// Success response helper
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
}

// Paginated success response
export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  pagination: PaginationInfo,
  statusCode: number = 200
): Response {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return sendSuccess(res, data, statusCode, {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    totalPages,
  });
}

// Error response helper
export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: unknown
): Response {
  const errorObj: ApiResponse['error'] = {
    code,
    message,
  };

  if (details !== undefined) {
    errorObj!.details = details;
  }

  const response: ApiResponse = {
    success: false,
    error: errorObj,
  };
  return res.status(statusCode).json(response);
}

// Common error responses
export function sendBadRequest(
  res: Response,
  message: string = 'Bad request',
  details?: unknown
): Response {
  return sendError(res, message, 400, 'BAD_REQUEST', details);
}

export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return sendError(res, message, 401, 'UNAUTHORIZED');
}

export function sendForbidden(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return sendError(res, message, 403, 'FORBIDDEN');
}

export function sendNotFound(
  res: Response,
  message: string = 'Resource not found'
): Response {
  return sendError(res, message, 404, 'NOT_FOUND');
}

export function sendConflict(
  res: Response,
  message: string = 'Resource conflict'
): Response {
  return sendError(res, message, 409, 'CONFLICT');
}

export function sendValidationError(
  res: Response,
  errors: { field: string; message: string }[]
): Response {
  return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
}

export function sendRateLimitExceeded(
  res: Response,
  message: string = 'Rate limit exceeded'
): Response {
  return sendError(res, message, 429, 'RATE_LIMIT_EXCEEDED');
}

export function sendInternalError(
  res: Response,
  message: string = 'Internal server error'
): Response {
  return sendError(res, message, 500, 'INTERNAL_ERROR');
}

// Created response (201)
export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

// No content response (204)
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

// Simple success response (for JSON data)
export function successResponse<T>(data: T, message?: string): { success: true; data: T; message?: string } {
  const result: { success: true; data: T; message?: string } = { success: true, data };
  if (message) {
    result.message = message;
  }
  return result;
}

// Simple error response (for JSON data)
export function errorResponse(message: string, details?: unknown): { success: false; error: { message: string; details?: unknown } } {
  const error: { message: string; details?: unknown } = { message };
  if (details !== undefined) {
    error.details = details;
  }
  return { success: false, error };
}

// Simple paginated response (for JSON data)
// Supports both object form and positional arguments for backward compatibility
export function paginatedResponse<T>(
  data: T[],
  totalOrPagination: number | PaginationInfo,
  pageOrExtra?: number | Record<string, unknown>,
  limitNum?: number
): {
  success: true;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
} & Record<string, unknown> {
  let page: number;
  let limit: number;
  let total: number;
  let extraData: Record<string, unknown> | undefined;

  if (typeof totalOrPagination === 'object') {
    // Object form: paginatedResponse(data, { page, limit, total }, extraData?)
    page = totalOrPagination.page;
    limit = totalOrPagination.limit;
    total = totalOrPagination.total;
    extraData = pageOrExtra as Record<string, unknown> | undefined;
  } else {
    // Positional form: paginatedResponse(data, total, page, limit)
    total = totalOrPagination;
    page = pageOrExtra as number;
    limit = limitNum as number;
  }

  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    ...extraData,
  };
}
