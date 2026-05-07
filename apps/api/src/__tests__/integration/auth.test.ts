import { describe, it, expect, vi, beforeAll } from 'vitest';
import supertest from 'supertest';

// ─── Mock DB client ───────────────────────────────────────────────────────────
vi.mock('../../db/client.js', () => ({
  pool: {},
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
}));

// ─── Mock services with configurable auth ────────────────────────────────────
vi.mock('../../lib/services.js', () => ({
  createServices: () => ({
    auth: {
      verifyToken: async (token: string) => {
        if (token === 'test-token') {
          return {
            userId: 'test-user',
            tenantId: 'test-tenant',
            email: 'test@example.com',
            role: 'regulatory_lead',
          };
        }
        // Any other token is rejected with 401
        throw Object.assign(new Error('Invalid token'), {
          statusCode: 401,
          code: 'UNAUTHORIZED',
        });
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

// ─── Mock registrations service (used as the protected resource) ──────────────
vi.mock('../../services/registrations.service.js', () => ({
  listRegistrations: vi.fn().mockResolvedValue({ data: [], total: 0, nextCursor: null }),
  createRegistration: vi.fn().mockResolvedValue({ id: 'reg-123' }),
  getRegistration: vi.fn().mockResolvedValue({ id: 'reg-123' }),
  updateRegistration: vi.fn().mockResolvedValue({ id: 'reg-123' }),
  archiveRegistration: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/audit.service.js', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

import { createTestApp } from '../helpers/app.js';

const PROTECTED_ROUTE = '/api/v1/registrations';

describe('Auth boundary', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  it('returns 401 when Authorization header is missing entirely', async () => {
    const res = await supertest(app).get(PROTECTED_ROUTE);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when Authorization header is present but malformed (no Bearer prefix)', async () => {
    const res = await supertest(app)
      .get(PROTECTED_ROUTE)
      .set('Authorization', 'Basic some-credentials');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when token is invalid', async () => {
    const res = await supertest(app)
      .get(PROTECTED_ROUTE)
      .set('Authorization', 'Bearer invalid-token-xyz');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 when token is valid', async () => {
    const res = await supertest(app)
      .get(PROTECTED_ROUTE)
      .set('Authorization', 'Bearer test-token');
    expect(res.status).toBe(200);
  });

  it('returns 401 when Authorization header is empty string after Bearer', async () => {
    const res = await supertest(app)
      .get(PROTECTED_ROUTE)
      .set('Authorization', 'Bearer ');
    // Empty token after trim still triggers verifyToken which throws 401
    expect(res.status).toBe(401);
  });
});
