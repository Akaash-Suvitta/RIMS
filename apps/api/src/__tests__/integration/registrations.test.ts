import { describe, it, expect, vi, beforeAll } from 'vitest';
import supertest from 'supertest';

// ─── Mock the DB client before anything imports it ────────────────────────────
// db/client.ts calls validateConnection() at module load time which tries to
// connect to Postgres. We replace the whole module so no real network call happens.
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

// ─── Mock the registrations service ──────────────────────────────────────────
vi.mock('../../services/registrations.service.js', () => ({
  listRegistrations: vi.fn().mockResolvedValue({ data: [], total: 0, nextCursor: null }),
  createRegistration: vi.fn().mockResolvedValue({
    id: 'reg-123',
    status: 'pending',
    registration_type: 'new_application',
    tenant_id: 'test-tenant',
  }),
  getRegistration: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000099',
    status: 'active',
    tenant_id: 'test-tenant',
  }),
  updateRegistration: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000099',
    status: 'active',
  }),
  archiveRegistration: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock the audit service (called from registrations service) ───────────────
vi.mock('../../services/audit.service.js', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

// ─── Import the test app AFTER all mocks are set up ──────────────────────────
import { createTestApp } from '../helpers/app.js';
import { AUTH } from '../helpers/app.js';

const VALID_UUID = '00000000-0000-0000-0000-000000000099';

const VALID_REGISTRATION_BODY = {
  productId: '00000000-0000-0000-0000-000000000001',
  marketId: '00000000-0000-0000-0000-000000000002',
  haId: '00000000-0000-0000-0000-000000000003',
  registrationType: 'new_application',
  status: 'pending',
};

describe('Registrations API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  // ── Health check (public) ────────────────────────────────────────────────────
  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await supertest(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  // ── GET /api/v1/registrations ────────────────────────────────────────────────
  describe('GET /api/v1/registrations', () => {
    it('returns 401 with no auth header', async () => {
      const res = await supertest(app).get('/api/v1/registrations');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('returns 200 with valid token', async () => {
      const res = await supertest(app)
        .get('/api/v1/registrations')
        .set(AUTH.lead);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ data: [], total: 0 });
    });
  });

  // ── POST /api/v1/registrations ───────────────────────────────────────────────
  describe('POST /api/v1/registrations', () => {
    it('returns 201 with valid token and valid body', async () => {
      const res = await supertest(app)
        .post('/api/v1/registrations')
        .set(AUTH.lead)
        .send(VALID_REGISTRATION_BODY);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe('reg-123');
    });

    it('returns 400 with valid token but missing required fields', async () => {
      const res = await supertest(app)
        .post('/api/v1/registrations')
        .set(AUTH.lead)
        .send({ registrationType: 'new_application' }); // missing productId, marketId, haId
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 with no auth header', async () => {
      const res = await supertest(app)
        .post('/api/v1/registrations')
        .send(VALID_REGISTRATION_BODY);
      expect(res.status).toBe(401);
    });

    it('returns 403 when role is read_only (not in CONTRIBUTOR_ROLES)', async () => {
      const res = await supertest(app)
        .post('/api/v1/registrations')
        .set(AUTH.readOnly)
        .send(VALID_REGISTRATION_BODY);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // ── GET /api/v1/registrations/:id ───────────────────────────────────────────
  describe('GET /api/v1/registrations/:id', () => {
    it('returns 200 with valid token and valid UUID', async () => {
      const res = await supertest(app)
        .get(`/api/v1/registrations/${VALID_UUID}`)
        .set(AUTH.lead);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(VALID_UUID);
    });

    it('returns 400 with invalid UUID format', async () => {
      const res = await supertest(app)
        .get('/api/v1/registrations/not-a-uuid')
        .set(AUTH.lead);
      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /api/v1/registrations/:id/archive ────────────────────────────────
  describe('DELETE /api/v1/registrations/:id/archive', () => {
    it('returns 204 with regulatory_lead token (in MANAGER_ROLES)', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/registrations/${VALID_UUID}/archive`)
        .set(AUTH.lead);
      expect(res.status).toBe(204);
    });

    it('returns 403 with read_only token (not in MANAGER_ROLES)', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/registrations/${VALID_UUID}/archive`)
        .set(AUTH.readOnly);
      expect(res.status).toBe(403);
    });
  });
});
