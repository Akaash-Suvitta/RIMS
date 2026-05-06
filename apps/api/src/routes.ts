import { Router } from 'express';
import { healthHandler } from './handlers/health.js';
import {
  listRegistrations,
  createRegistration,
  getRegistrationById,
  updateRegistration,
  archiveRegistration,
} from './handlers/registrations.js';
import { authMiddleware } from './middleware/auth.js';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/health', healthHandler);

// ─── Protected routes (auth required) ────────────────────────────────────────
router.use('/api/v1', authMiddleware);

// Registrations
router.get('/api/v1/registrations', listRegistrations);
router.post('/api/v1/registrations', createRegistration);
router.get('/api/v1/registrations/:id', getRegistrationById);
router.patch('/api/v1/registrations/:id', updateRegistration);
router.delete('/api/v1/registrations/:id', archiveRegistration);

export { router };
