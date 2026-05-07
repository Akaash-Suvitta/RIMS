import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router } from '../../routes.js';
import { errorHandler } from '../../middleware/error.js';

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  app.use('/', router);
  app.use(errorHandler);
  return app;
}

// Auth headers for different roles
export const AUTH = {
  // regulatory_lead — can read, write, and manage (archive)
  lead: { Authorization: 'Bearer test-token' },
  // read_only — cannot contribute (only for tests that mock verifyToken directly)
  readOnly: { Authorization: 'Bearer readonly-token' },
  // No auth header
  none: {},
} as const;
