import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { ApiError } from './utils/apiError.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { requestLogger } from './middleware/requestLogger.middleware.js';
import healthRoutes from './routes/health.routes.js';
import masterRoutes from './routes/index.js';
import { getLiveness, getReadiness } from './controllers/health.controller.js';

const app = express();

// Request correlation tracking and structured logging
app.use(requestIdMiddleware);
app.use(requestLogger);

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing with credentials support
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key', 'X-Request-Id']
  })
);

// Body parsing middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Rate Limiting (Applied globally, with stricter limiter on auth routes)
app.use('/api', generalLimiter);

// Top-level liveness & readiness probes
app.get('/health', getLiveness);
app.get('/ready', getReadiness);

// Health routes under /health as well
app.use('/health', healthRoutes);

// Master API Routes under /api
app.use('/api', masterRoutes);

// Catch-all 404 handler for undefined routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
