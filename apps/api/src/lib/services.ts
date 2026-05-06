import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import Anthropic from '@anthropic-ai/sdk';
import { config, env } from './config.js';

// ─── Adapter interfaces ───────────────────────────────────────────────────────

export interface StorageAdapter {
  getPresignedUploadUrl(key: string, mimeType: string, sizeBytes?: number): Promise<string>;
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

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export interface AuthAdapter {
  verifyToken(token: string): Promise<AuthUser>;
}

export interface AiAdapter {
  chat(opts: {
    systemPrompt: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ reply: string; tokensUsed: number }>;

  streamChat(opts: {
    systemPrompt: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): AsyncIterable<string>;

  analyzeGaps(dossierId: string, sectionContent: string): Promise<{
    gaps: string[];
    suggestions: string[];
  }>;
}

// ─── Database adapter ─────────────────────────────────────────────────────────

export interface DbAdapter {
  pool: pg.Pool;
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    sql: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<R>>;
}

export interface Services {
  storage: StorageAdapter;
  email: EmailAdapter;
  auth: AuthAdapter;
  ai: AiAdapter;
  db: DbAdapter;
}

// ─── Local adapters ────────────────────────────────────────────────────────────

function createLocalStorageAdapter(): StorageAdapter {
  const uploadsDir = path.resolve('./uploads');

  return {
    async getPresignedUploadUrl(key: string, _mimeType: string): Promise<string> {
      // Ensure upload directory exists
      const keyDir = path.dirname(path.join(uploadsDir, key));
      fs.mkdirSync(keyDir, { recursive: true });
      console.log(`[storage:local] getPresignedUploadUrl key=${key}`);
      return `http://localhost:${config.PORT}/uploads/${key}`;
    },
    async getPresignedDownloadUrl(key: string): Promise<string> {
      console.log(`[storage:local] getPresignedDownloadUrl key=${key}`);
      return `http://localhost:${config.PORT}/uploads/${key}`;
    },
    async deleteObject(key: string): Promise<void> {
      const filePath = path.join(uploadsDir, key);
      try {
        fs.unlinkSync(filePath);
      } catch {
        // File may not exist — ignore
      }
      console.log(`[storage:local] deleteObject key=${key}`);
    },
  };
}

function createLocalEmailAdapter(): EmailAdapter {
  return {
    async sendEmail(opts): Promise<void> {
      console.log(`[EMAIL] to=${opts.to} subject="${opts.subject}"`);
      console.log(`[EMAIL] body=${opts.textBody ?? opts.htmlBody}`);
    },
  };
}

function createLocalAuthAdapter(): AuthAdapter {
  return {
    async verifyToken(token: string): Promise<AuthUser> {
      // Accept dev-token-{userId} pattern
      if (token.startsWith('dev-token-')) {
        const userId = token.slice('dev-token-'.length);
        return {
          userId,
          tenantId: 'test-tenant',
          email: `${userId}@regaxis.local`,
          role: 'regulatory_lead',
        };
      }
      // Also accept the legacy test-token
      if (token === 'test-token') {
        return {
          userId: 'test-user',
          tenantId: 'test-tenant',
          email: 'test@regaxis.local',
          role: 'regulatory_lead',
        };
      }
      throw Object.assign(new Error('Invalid local token. Use "dev-token-{userId}" or "test-token".'), {
        statusCode: 401,
        code: 'UNAUTHORIZED',
      });
    },
  };
}

async function* stubStream(reply: string): AsyncIterable<string> {
  const tokens = reply.split(' ');
  for (const token of tokens) {
    await new Promise<void>((r) => setTimeout(r, 50));
    yield token + ' ';
  }
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
    streamChat(_opts): AsyncIterable<string> {
      return stubStream('This is a stub streaming AI response. Configure ANTHROPIC_API_KEY for real responses.');
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

const DEMO_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function createAwsStorageAdapter(isDemoTier: boolean): StorageAdapter {
  const s3 = new S3Client({ region: config.AWS_REGION });
  const bucket = config.S3_BUCKET;
  const DOWNLOAD_EXPIRY_SECONDS = 900; // 15 minutes
  const UPLOAD_EXPIRY_SECONDS = 300;   // 5 minutes

  return {
    async getPresignedUploadUrl(key: string, mimeType: string, sizeBytes?: number): Promise<string> {
      if (isDemoTier && sizeBytes !== undefined && sizeBytes > DEMO_MAX_FILE_BYTES) {
        const err = Object.assign(
          new Error('File exceeds the 10 MB demo upload limit.'),
          { statusCode: 402, code: 'DEMO_LIMIT_EXCEEDED', limit: '10 MB', current: `${(sizeBytes / 1_048_576).toFixed(1)} MB` },
        );
        throw err;
      }
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: mimeType,
      });
      return getSignedUrl(s3, command, { expiresIn: UPLOAD_EXPIRY_SECONDS });
    },

    async getPresignedDownloadUrl(key: string): Promise<string> {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      return getSignedUrl(s3, command, { expiresIn: DOWNLOAD_EXPIRY_SECONDS });
    },

    async deleteObject(key: string): Promise<void> {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

function createSesEmailAdapter(): EmailAdapter {
  const ses = new SESClient({ region: config.AWS_REGION });

  return {
    async sendEmail(opts): Promise<void> {
      await ses.send(new SendEmailCommand({
        Source: config.SES_FROM_ADDRESS,
        Destination: { ToAddresses: [opts.to] },
        Message: {
          Subject: { Data: opts.subject },
          Body: {
            Html: { Data: opts.htmlBody },
            ...(opts.textBody ? { Text: { Data: opts.textBody } } : {}),
          },
        },
      }));
    },
  };
}

function createCognitoAuthAdapter(): AuthAdapter {
  const jwksClient = jwksRsa({
    jwksUri: `https://cognito-idp.${config.COGNITO_REGION}.amazonaws.com/${config.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
    cache: true,
    cacheMaxAge: 3600000, // 1 hour
  });

  function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
    jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
        return;
      }
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    });
  }

  return {
    verifyToken(token: string): Promise<AuthUser> {
      return new Promise((resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          {
            algorithms: ['RS256'],
            issuer: `https://cognito-idp.${config.COGNITO_REGION}.amazonaws.com/${config.COGNITO_USER_POOL_ID}`,
            audience: config.COGNITO_CLIENT_ID,
          },
          (err, decoded) => {
            if (err || !decoded || typeof decoded === 'string') {
              reject(Object.assign(new Error('Invalid or expired token.'), { statusCode: 401, code: 'UNAUTHORIZED' }));
              return;
            }
            const payload = decoded as Record<string, unknown>;
            resolve({
              userId: String(payload['sub'] ?? ''),
              tenantId: String(payload['custom:org_id'] ?? ''),
              email: String(payload['email'] ?? ''),
              role: String(payload['custom:role'] ?? 'read_only'),
            });
          },
        );
      });
    },
  };
}

function createAnthropicAiAdapter(): AiAdapter {
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

  return {
    async chat(opts): Promise<{ reply: string; tokensUsed: number }> {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: opts.systemPrompt,
        messages: opts.messages,
      });
      const textBlock = response.content.find((b) => b.type === 'text');
      return {
        reply: textBlock?.type === 'text' ? textBlock.text : '',
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    },

    async *streamChat(opts): AsyncIterable<string> {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: opts.systemPrompt,
        messages: opts.messages,
      });
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }
      }
    },

    async analyzeGaps(dossierId: string, sectionContent: string) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: 'You are a regulatory affairs expert. Analyze dossier sections for gaps and provide actionable suggestions. Respond with JSON: { "gaps": string[], "suggestions": string[] }',
        messages: [
          {
            role: 'user',
            content: `Analyze dossier ${dossierId}:\n\n${sectionContent}`,
          },
        ],
      });
      const textBlock = response.content.find((b) => b.type === 'text');
      const text = textBlock?.type === 'text' ? textBlock.text : '{"gaps":[],"suggestions":[]}';
      try {
        const parsed = JSON.parse(text) as { gaps?: string[]; suggestions?: string[] };
        return {
          gaps: parsed.gaps ?? [],
          suggestions: parsed.suggestions ?? [],
        };
      } catch {
        return { gaps: [], suggestions: [] };
      }
    },
  };
}

// ─── Database adapter factory ─────────────────────────────────────────────────

function createDbAdapter(): DbAdapter {
  const POOL_SIZE = env.isLocal ? 10 : env.isDemo ? 5 : 10;

  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    max: POOL_SIZE,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
  });

  // Validate connection at startup
  pool.connect().then((client) => {
    client.query('SELECT 1').then(() => {
      client.release();
      console.log('[db] PostgreSQL connection verified.');
    }).catch((err: unknown) => {
      client.release();
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[db] Startup connection check failed: ${msg}`);
    });
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[db] Failed to acquire connection at startup: ${msg}`);
  });

  return {
    pool,
    query<R extends pg.QueryResultRow = pg.QueryResultRow>(
      sql: string,
      values?: unknown[],
    ): Promise<pg.QueryResult<R>> {
      return pool.query<R>(sql, values);
    },
  };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createServices(): Services {
  const db = createDbAdapter();

  if (env.isLocal) {
    return {
      storage: createLocalStorageAdapter(),
      email: createLocalEmailAdapter(),
      auth: createLocalAuthAdapter(),
      ai: createLocalAiAdapter(),
      db,
    };
  }

  return {
    storage: createAwsStorageAdapter(env.isDemo),
    email: createSesEmailAdapter(),
    auth: createCognitoAuthAdapter(),
    ai: createAnthropicAiAdapter(),
    db,
  };
}
