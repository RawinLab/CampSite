import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { applySecurityMiddleware } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import provincesRouter from './routes/provinces';
import searchRouter from './routes/search';
import mapRouter from './routes/map';
import attractionsRouter from './routes/attractions';
import campsitesRouter from './routes/campsites';
import reviewsRouter from './routes/reviews';
import wishlistRouter from './routes/wishlist';
import adminRouter from './routes/admin';
import dashboardRouter from './routes/dashboard';
import inquiriesRouter from './routes/inquiries';

const app: Express = express();

// Apply security middleware (helmet, cors, rate limiting)
applySecurityMiddleware(app);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as any).user?.id;
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ...(userId && { userId }),
    });
  });
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/provinces', provincesRouter);
app.use('/api/search', searchRouter);
app.use('/api/map', mapRouter);
app.use('/api', attractionsRouter);
app.use('/api/campsites', campsitesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/inquiries', inquiriesRouter);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

export default app;
