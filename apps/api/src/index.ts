// Bootstrap: import config first to validate env vars at startup
import { config, env } from './lib/config.js';
import { createServices } from './lib/services.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { router } from './routes.js';
import { errorHandler } from './middleware/error.js';

// Initialise external service adapters (db, storage, email, auth, AI)
// This also validates the DB connection at startup.
createServices();

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: !env.isLocal
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsOrigins: string[] = env.isLocal
  ? ['http://localhost:3000', 'http://localhost:3001']
  : env.isDemo
    ? [config.DEMO_FRONTEND_URL ?? 'https://demo.regaxis.com']
    : [config.PROD_FRONTEND_URL ?? 'https://app.regaxis.com'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(morgan(config.APP_ENV === 'production' ? 'combined' : 'dev'));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Global rate limit — auth and AI sub-routes may have tighter limits applied
// at the router level if needed.

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: env.isLocal
    ? 100_000     // effectively disabled for local dev
    : env.isDemo
      ? 100         // 100 req / 15 min / IP in demo
      : 500,        // 500 req / 15 min / IP in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
  },
  skip: (req) => req.path === '/health' || req.path === '/health/db',
});

app.use(limiter);

// ─── Auth-specific tighter rate limit ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isLocal ? 100_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

app.use('/api/v1/auth/refresh', authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(router);

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`[api] RegAxis RIM API running on port ${PORT} (APP_ENV=${config.APP_ENV})`);
  console.log(`[api] CORS origins: ${corsOrigins.join(', ')}`);
});

export { app };
