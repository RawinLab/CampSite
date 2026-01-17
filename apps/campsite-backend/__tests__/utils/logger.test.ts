import logger, { logRequest, logDbOperation, logInfo, logError } from '../../src/utils/logger';

describe('Logger', () => {
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => logger);
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logger instance', () => {
    it('is defined with correct methods', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('logRequest', () => {
    it('logs successful requests as info', () => {
      logRequest('GET', '/api/test', 200, 50);
      expect(infoSpy).toHaveBeenCalled();
    });

    it('logs client errors as warn', () => {
      logRequest('POST', '/api/test', 400, 30);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('logs server errors as error', () => {
      logRequest('GET', '/api/test', 500, 100);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('includes userId when provided', () => {
      logRequest('GET', '/api/test', 200, 50, 'user-123');
      expect(infoSpy).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({ userId: 'user-123' })
      );
    });
  });

  describe('logDbOperation', () => {
    it('logs successful operations as debug', () => {
      logDbOperation('SELECT', 'campsites', 10, true);
      expect(debugSpy).toHaveBeenCalled();
    });

    it('logs failed operations as error', () => {
      const error = new Error('Connection failed');
      logDbOperation('INSERT', 'reviews', 50, false, error);
      expect(errorSpy).toHaveBeenCalledWith(
        'Database operation failed',
        expect.objectContaining({ error: 'Connection failed' })
      );
    });
  });

  describe('convenience methods', () => {
    it('exports logInfo as function', () => {
      expect(typeof logInfo).toBe('function');
    });

    it('exports logError as function', () => {
      expect(typeof logError).toBe('function');
    });
  });
});
