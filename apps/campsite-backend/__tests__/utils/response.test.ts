import { Response } from 'express';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendRateLimitExceeded,
  sendInternalError,
  sendCreated,
  sendNoContent,
} from '../../src/utils/response';

describe('Response Helpers', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('sendSuccess', () => {
    it('sends success response with default 200 status', () => {
      sendSuccess(mockRes as Response, { message: 'Hello' });

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Hello' },
      });
    });

    it('sends success response with custom status', () => {
      sendSuccess(mockRes as Response, { id: 1 }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('includes meta when provided', () => {
      sendSuccess(mockRes as Response, [], 200, { total: 100 });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        meta: { total: 100 },
      });
    });
  });

  describe('sendPaginatedSuccess', () => {
    it('sends paginated response with meta', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, limit: 10, total: 25 };

      sendPaginatedSuccess(mockRes as Response, data, pagination);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });
  });

  describe('sendError', () => {
    it('sends error response with code and message', () => {
      sendError(mockRes as Response, 'Something went wrong', 500, 'SERVER_ERROR');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Something went wrong',
        },
      });
    });

    it('includes details when provided', () => {
      sendError(mockRes as Response, 'Validation failed', 400, 'VALIDATION', { field: 'email' });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION',
          message: 'Validation failed',
          details: { field: 'email' },
        },
      });
    });
  });

  describe('common error responses', () => {
    it('sendBadRequest sends 400', () => {
      sendBadRequest(mockRes as Response, 'Invalid input');
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('sendUnauthorized sends 401', () => {
      sendUnauthorized(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('sendForbidden sends 403', () => {
      sendForbidden(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('sendNotFound sends 404', () => {
      sendNotFound(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('sendConflict sends 409', () => {
      sendConflict(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('sendValidationError sends 400 with details', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      sendValidationError(mockRes as Response, errors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    });

    it('sendRateLimitExceeded sends 429', () => {
      sendRateLimitExceeded(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('sendInternalError sends 500', () => {
      sendInternalError(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('sendCreated', () => {
    it('sends 201 with data', () => {
      sendCreated(mockRes as Response, { id: 'new-id' });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'new-id' },
      });
    });
  });

  describe('sendNoContent', () => {
    it('sends 204 with no body', () => {
      sendNoContent(mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });
});
