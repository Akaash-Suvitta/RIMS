import { z } from 'zod';

const APP_ENV_VALUES = ['local', 'demo', 'production'] as const;

const envSchema = z.object({
  // Application
  APP_ENV: z.enum(APP_ENV_VALUES),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),

  // Database
  DATABASE_URL: z.string().url(),

  // Cognito
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),
  COGNITO_REGION: z.string().min(1),

  // AWS
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  // S3
  S3_BUCKET: z.string().min(1),
  S3_ENDPOINT: z.string().url().optional(),

  // SES
  SES_FROM_ADDRESS: z.string().email(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1),

  // Redis (optional — only required in demo/production)
  REDIS_URL: z.string().optional(),
});

type RawEnv = z.input<typeof envSchema>;
type ParsedEnv = z.output<typeof envSchema>;

let parsedConfig: ParsedEnv;

try {
  parsedConfig = envSchema.parse(process.env as unknown as RawEnv);
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`[config] Invalid environment variables:\n${issues}`);
  } else {
    console.error('[config] Failed to parse environment variables:', error);
  }
  process.exit(1);
}

export const config = parsedConfig;

export const env = {
  isLocal: config.APP_ENV === 'local',
  isDemo: config.APP_ENV === 'demo',
  isProd: config.APP_ENV === 'production',
} as const;
