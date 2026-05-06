import { config, env } from './config.js';

// ─── Adapter interfaces ───────────────────────────────────────────────────────

export interface StorageAdapter {
  getPresignedUploadUrl(key: string, mimeType: string): Promise<string>;
  getPresignedDownloadUrl(key: string): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

export interface EmailAdapter {
  sendEmail(opts: {
    to: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }): Promise<void>;
}

export interface AuthAdapter {
  verifyToken(token: string): Promise<{
    userId: string;
    tenantId: string;
    email: string;
    role: string;
  }>;
}

export interface AiAdapter {
  chat(opts: {
    systemPrompt: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ reply: string; tokensUsed: number }>;

  analyzeGaps(dossierId: string, sectionContent: string): Promise<{
    gaps: string[];
    suggestions: string[];
  }>;
}

export interface Services {
  storage: StorageAdapter;
  email: EmailAdapter;
  auth: AuthAdapter;
  ai: AiAdapter;
}

// ─── Stub adapters (local) ────────────────────────────────────────────────────

function createLocalStorageAdapter(): StorageAdapter {
  return {
    async getPresignedUploadUrl(key: string, _mimeType: string): Promise<string> {
      console.log(`[storage:stub] getPresignedUploadUrl key=${key}`);
      return `http://localhost:4566/${config.S3_BUCKET}/${key}?upload=stub`;
    },
    async getPresignedDownloadUrl(key: string): Promise<string> {
      console.log(`[storage:stub] getPresignedDownloadUrl key=${key}`);
      return `http://localhost:4566/${config.S3_BUCKET}/${key}?download=stub`;
    },
    async deleteObject(key: string): Promise<void> {
      console.log(`[storage:stub] deleteObject key=${key}`);
    },
  };
}

function createLocalEmailAdapter(): EmailAdapter {
  return {
    async sendEmail(opts): Promise<void> {
      console.log(`[email:stub] sendEmail to=${opts.to} subject="${opts.subject}"`);
    },
  };
}

function createLocalAuthAdapter(): AuthAdapter {
  return {
    async verifyToken(token: string) {
      console.log(`[auth:stub] verifyToken token=${token.slice(0, 20)}...`);
      return {
        userId: 'test-user',
        tenantId: 'test-tenant',
        email: 'test@regaxis.local',
        role: 'admin',
      };
    },
  };
}

function createLocalAiAdapter(): AiAdapter {
  return {
    async chat(_opts): Promise<{ reply: string; tokensUsed: number }> {
      console.log('[ai:stub] chat called — returning stub response');
      return {
        reply: 'This is a stub AI response. Configure ANTHROPIC_API_KEY for real responses.',
        tokensUsed: 0,
      };
    },
    async analyzeGaps(_dossierId: string, _sectionContent: string) {
      console.log('[ai:stub] analyzeGaps called — returning stub response');
      return {
        gaps: ['Section 2.1 is missing required safety data'],
        suggestions: ['Add non-clinical overview summary', 'Include tabulated summaries'],
      };
    },
  };
}

// ─── Production adapters (demo/production) ────────────────────────────────────
// These are thin stubs for now — implement the real AWS SDK calls in a follow-up task.

function createProductionStorageAdapter(): StorageAdapter {
  // TODO: implement using @aws-sdk/client-s3 with presigned URL generation
  console.warn('[storage] Production S3 adapter not yet implemented — using stub');
  return createLocalStorageAdapter();
}

function createProductionEmailAdapter(): EmailAdapter {
  // TODO: implement using @aws-sdk/client-ses
  console.warn('[email] Production SES adapter not yet implemented — using stub');
  return createLocalEmailAdapter();
}

function createProductionAuthAdapter(): AuthAdapter {
  // TODO: implement using jwks-rsa + jsonwebtoken to verify Cognito JWT
  console.warn('[auth] Production Cognito adapter not yet implemented — using stub');
  return createLocalAuthAdapter();
}

function createProductionAiAdapter(): AiAdapter {
  // TODO: implement using @anthropic-ai/sdk
  console.warn('[ai] Production Anthropic adapter not yet implemented — using stub');
  return createLocalAiAdapter();
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createServices(): Services {
  if (env.isLocal) {
    return {
      storage: createLocalStorageAdapter(),
      email: createLocalEmailAdapter(),
      auth: createLocalAuthAdapter(),
      ai: createLocalAiAdapter(),
    };
  }

  return {
    storage: createProductionStorageAdapter(),
    email: createProductionEmailAdapter(),
    auth: createProductionAuthAdapter(),
    ai: createProductionAiAdapter(),
  };
}
