import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express, Request, Response, NextFunction } from 'express';

// Parse CORS origins from environment variable (comma-separated)
const getAllowedOrigins = (): string[] | string => {
  const corsOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;
  if (!corsOrigins) {
    return ['http://localhost:3000'];
  }
  // Support comma-separated list of origins
  const origins = corsOrigins.split(',').map(o => o.trim());
  return origins.length === 1 ? origins[0] : origins;
};

// CORS configuration - use function to evaluate at request time
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string | string[]) => void) => {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (typeof allowedOrigins === 'string') {
      // Single origin
      callback(null, allowedOrigins);
    } else if (Array.isArray(allowedOrigins)) {
      // Multiple origins
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      callback(new Error('Invalid CORS configuration'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Rate limiting - general API
// Skip rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 0 : 1000, // 0 = unlimited in test, 1000 in production (10x for E2E)
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv, // Skip rate limiting in test environment
});

// Rate limiting - inquiry endpoint (Q18: 5 per 24h)
export const inquiryLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: isTestEnv ? 0 : 50, // 0 = unlimited in test, 50 in production (10x for E2E)
  message: { error: 'You have exceeded the maximum number of inquiries. Please try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv, // Skip rate limiting in test environment
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).user?.id || req.ip || 'anonymous';
  },
});

// Rate limiting - auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 0 : 100, // 0 = unlimited in test, 100 in production (10x for E2E)
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv, // Skip rate limiting in test environment
});

// Apply security middleware
export function applySecurityMiddleware(app: Express) {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://*.supabase.co'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.use(cors(corsOptions));

  // General rate limiting
  app.use('/api/', generalLimiter);
}
