import { Request, Response, NextFunction } from 'express';
import { validate } from '../../src/middleware/validation';
import { z } from 'zod';

describe('Validation Middleware', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('passes validation for valid body data', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const mockReq: Partial<Request> = {
      body: { name: 'Test', email: 'test@test.com' },
    };

    const middleware = validate(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid data', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const mockReq: Partial<Request> = {
      body: { name: '', email: 'invalid-email' },
    };

    const middleware = validate(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'email' }),
        ]),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('validates query parameters', () => {
    const schema = z.object({
      page: z.string().regex(/^\d+$/),
    });

    const mockReq: Partial<Request> = {
      query: { page: '1' },
    };

    const middleware = validate(schema, 'query');
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('validates URL params', () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const mockReq: Partial<Request> = {
      params: { id: '123e4567-e89b-12d3-a456-426614174000' },
    };

    const middleware = validate(schema, 'params');
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('rejects invalid UUID in params', () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const mockReq: Partial<Request> = {
      params: { id: 'not-a-uuid' },
    };

    const middleware = validate(schema, 'params');
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
