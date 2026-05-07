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

// ─── Mock the submissions service ─────────────────────────────────────────────
vi.mock('../../services/submissions.service.js', () => ({
  listSubmissions: vi.fn().mockResolvedValue({ data: [], total: 0, nextCursor: null }),
  createSubmission: vi.fn().mockResolvedValue({
    id: 'sub-123',
    status: 'draft',
    submission_type: 'nda',
    tenant_id: 'test-tenant',
  }),
  getSubmission: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000099',
    status: 'draft',
    tenant_id: 'test-tenant',
  }),
  updateSubmission: vi.fn().mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000099',
    status: 'submitted',
  }),
}));

// ─── Mock audit service ───────────────────────────────────────────────────────
vi.mock('../../services/audit.service.js', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { createTestApp, AUTH } from '../helpers/app.js';

const VALID_UUID = '00000000-0000-0000-0000-000000000099';

const VALID_SUBMISSION_BODY = {
  productId: '00000000-0000-0000-0000-000000000001',
  haId: '00000000-0000-0000-0000-000000000002',
  submissionType: 'nda',
  notes: 'Initial NDA submission',
};

describe('Submissions API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  // ── GET /api/v1/submissions ──────────────────────────────────────────────────
  describe('GET /api/v1/submissions', () => {
    it('returns 401 with no auth header', async () => {
      const res = await supertest(app).get('/api/v1/submissions');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('returns 200 with valid token', async () => {
      const res = await supertest(app)
        .get('/api/v1/submissions')
        .set(AUTH.lead);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ data: [], total: 0 });
    });
  });

  // ── POST /api/v1/submissions ─────────────────────────────────────────────────
  describe('POST /api/v1/submissions', () => {
    it('returns 201 with valid token and valid body', async () => {
      const res = await supertest(app)
        .post('/api/v1/submissions')
        .set(AUTH.lead)
        .send(VALID_SUBMISSION_BODY);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe('sub-123');
    });

    it('returns 400 with valid token but missing required fields', async () => {
      const res = await supertest(app)
        .post('/api/v1/submissions')
        .set(AUTH.lead)
        .send({ notes: 'missing productId, haId, submissionType' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 403 with read_only token', async () => {
      const res = await supertest(app)
        .post('/api/v1/submissions')
        .set(AUTH.readOnly)
        .send(VALID_SUBMISSION_BODY);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('returns 401 with no auth', async () => {
      const res = await supertest(app)
        .post('/api/v1/submissions')
        .send(VALID_SUBMISSION_BODY);
      expect(res.status).toBe(401);
    });
  });

  // ── GET /api/v1/submissions/:id ──────────────────────────────────────────────
  describe('GET /api/v1/submissions/:id', () => {
    it('returns 200 with valid token', async () => {
      const res = await supertest(app)
        .get(`/api/v1/submissions/${VALID_UUID}`)
        .set(AUTH.lead);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(VALID_UUID);
    });

    it('returns 401 with no auth header', async () => {
      const res = await supertest(app).get(`/api/v1/submissions/${VALID_UUID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 with invalid UUID format', async () => {
      const res = await supertest(app)
        .get('/api/v1/submissions/not-a-uuid')
        .set(AUTH.lead);
      expect(res.status).toBe(400);
    });
  });
});
