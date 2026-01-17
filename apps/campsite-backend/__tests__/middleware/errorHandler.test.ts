import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';

// Mock logger before importing errorHandler
jest.mock('../../src/utils/logger', () => {
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
    logError: mockLogger.error,
    logInfo: mockLogger.info,
    logWarn: mockLogger.warn,
    logDebug: mockLogger.debug,
  };
});

import { errorHandler, AppError, createNotFoundError, createBadRequestError } from '../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      path: '/test',
      method: 'GET',
      body: {},
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('handles AppError correctly', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: 'Test error',
      },
    });
  });

  it('handles ZodError validation errors', () => {
    const schema = z.object({ name: z.string().min(1) });
    let zodError: ZodError;

    try {
      schema.parse({ name: '' });
    } catch (e) {
      zodError = e as ZodError;
    }

    errorHandler(zodError!, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
  });

  it('handles generic errors as 500', () => {
    const error = new Error('Generic error');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('creates NotFoundError correctly', () => {
    const error = createNotFoundError('User');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('User not found');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('creates BadRequestError correctly', () => {
    const error = createBadRequestError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('BAD_REQUEST');
  });
});
