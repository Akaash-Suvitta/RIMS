// Bootstrap: import config first to validate env vars at startup
import { config } from './lib/config.js';
import { createServices } from './lib/services.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { router } from './routes.js';
import { errorHandler } from './middleware/error.js';

// Initialise external service adapters (storage, email, auth, AI)
const _services = createServices();

const app = express();

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin:
      config.APP_ENV === 'local'
        ? ['http://localhost:3000']
        : [process.env.ALLOWED_ORIGIN ?? 'https://rim.regaxis.com'],
    credentials: true,
  }),
);

app.use(morgan(config.APP_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(router);

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`[api] RegAxis RIM API running on port ${PORT} (APP_ENV=${config.APP_ENV})`);
});

export { app };
