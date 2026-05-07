import { describe, it, expect, vi, beforeAll } from 'vitest';
import supertest from 'supertest';

// ─── Mock DB client before it executes validateConnection() ──────────────────
vi.mock('../../db/client.js', () => ({
  pool: {},
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
}));

// ─── Mock external services ───────────────────────────────────────────────────
vi.mock('../../lib/services.js', () => ({
  createServices: () => ({
    auth: {
      verifyToken: async (token: string) => {
        if (token === 'test-token') {
          return { userId: 'test-user', tenantId: 'test-tenant', email: 'test@example.com', role: 'regulatory_lead' };
        }
        if (token === 'readonly-token') {
          return { userId: 'readonly-user', tenantId: 'test-tenant', email: 'readonly@example.com', role: 'read_only' };
        }
        throw Object.assign(new Error('Unauthorized'), { statusCode: 401, code: 'UNAUTHORIZED' });
      },
    },
    storage: {
      getPresignedUploadUrl: vi.fn(),
      getPresignedDownloadUrl: vi.fn(),
      deleteObject: vi.fn(),
    },
    email: { sendEmail: vi.fn() },
    ai: { chat: vi.fn(), streamChat: vi.fn(), analyzeGaps: vi.fn() },
    db: { pool: {}, query: vi.fn() },
  }),
}));

// ─── Mock the renewals service ────────────────────────────────────────────────
vi.mock('../../services/renewals.service.js', () => ({
  listRenewals: vi.fn().mockResolvedValue({ data: [], total: 0, nextCursor: null }),
  createRenewal: vi.fn().mockResolvedValue({
    id: 'renewal-123',
    status: 'upcoming',
    tenant_id: 'test-tenant',
    registration_id: '00000000-0000-0000-0000-000000000001',
  }),
  getRenewal: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000099',
    status: 'upcoming',
    tenant_id: 'test-tenant',
  }),
  updateRenewal: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000099',
    status: 'in_progress',
  }),
  listRenewalTasks: vi.fn().mockResolvedValue([]),
  createRenewalTask: vi.fn().mockResolvedValue({
    id: 'task-123',
    title: 'Test Task',
    status: 'todo',
  }),
  updateRenewalTask: vi.fn().mockResolvedValue({
    id: 'task-123',
    title: 'Updated Task',
    status: 'in_progress',
  }),
}));

// ─── Mock audit service ───────────────────────────────────────────────────────
vi.mock('../../services/audit.service.js', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { createTestApp, AUTH } from '../helpers/app.js';

const VALID_UUID = '00000000-0000-0000-0000-000000000099';

const VALID_RENEWAL_BODY = {
  registrationId: '00000000-0000-0000-0000-000000000001',
  targetSubmissionDate: '2026-12-31',
  notes: 'Annual renewal',
};

describe('Renewals API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  // ── GET /api/v1/renewals ─────────────────────────────────────────────────────
  describe('GET /api/v1/renewals', () => {
    it('returns 401 with no auth header', async () => {
      const res = await supertest(app).get('/api/v1/renewals');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('returns 200 with valid token', async () => {
      const res = await supertest(app)
        .get('/api/v1/renewals')
        .set(AUTH.lead);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ data: [], total: 0 });
    });
  });

  // ── POST /api/v1/renewals ────────────────────────────────────────────────────
  describe('POST /api/v1/renewals', () => {
    it('returns 201 with valid token and valid body', async () => {
      const res = await supertest(app)
        .post('/api/v1/renewals')
        .set(AUTH.lead)
        .send(VALID_RENEWAL_BODY);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe('renewal-123');
    });

    it('returns 400 with valid token but missing required fields', async () => {
      const res = await supertest(app)
        .post('/api/v1/renewals')
        .set(AUTH.lead)
        .send({ notes: 'missing registrationId' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 with read_only token', async () => {
      const res = await supertest(app)
        .post('/api/v1/renewals')
        .set(AUTH.readOnly)
        .send(VALID_RENEWAL_BODY);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // ── GET /api/v1/renewals/:id ─────────────────────────────────────────────────
  describe('GET /api/v1/renewals/:id', () => {
    it('returns 200 with valid token', async () => {
      const res = await supertest(app)
        .get(`/api/v1/renewals/${VALID_UUID}`)
        .set(AUTH.lead);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(VALID_UUID);
    });

    it('returns 401 with no auth header', async () => {
      const res = await supertest(app).get(`/api/v1/renewals/${VALID_UUID}`);
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/v1/renewals/:id/tasks ──────────────────────────────────────────
  describe('GET /api/v1/renewals/:id/tasks', () => {
    it('returns 200 with valid token', async () => {
      const res = await supertest(app)
        .get(`/api/v1/renewals/${VALID_UUID}/tasks`)
        .set(AUTH.lead);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 401 with no auth header', async () => {
      const res = await supertest(app).get(`/api/v1/renewals/${VALID_UUID}/tasks`);
      expect(res.status).toBe(401);
    });
  });
});
