import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;

  // Add stack trace for errors
  if (stack) {
    log += `\n${stack}`;
  }

  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`;
  }

  return log;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'campsite-api' },
  transports: [
    // Console transport with colors for development
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  const logsDir = process.env.LOGS_DIR || 'logs';

  // Error log
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Request logging helper
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  const logData = {
    type: 'request',
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...(userId && { userId }),
  };

  if (statusCode >= 500) {
    logger.error('Request failed', logData);
  } else if (statusCode >= 400) {
    logger.warn('Request error', logData);
  } else {
    logger.info('Request completed', logData);
  }
}

// Database operation logging helper
export function logDbOperation(
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  error?: Error
) {
  const logData = {
    type: 'database',
    operation,
    table,
    duration: `${duration}ms`,
    success,
  };

  if (!success && error) {
    logger.error('Database operation failed', { ...logData, error: error.message });
  } else {
    logger.debug('Database operation', logData);
  }
}

// Export individual log methods for convenience
export const logInfo = logger.info.bind(logger);
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logDebug = logger.debug.bind(logger);

export default logger;
