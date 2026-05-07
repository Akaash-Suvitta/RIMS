// Set all required env vars BEFORE any module is imported.
// This prevents config.ts from calling process.exit(1) during test runs.

process.env.APP_ENV = 'local';
process.env.PORT = '3002';
process.env.DATABASE_URL = 'postgresql://rim:rim@localhost:5432/rim_test';
process.env.COGNITO_USER_POOL_ID = 'test-pool';
process.env.COGNITO_CLIENT_ID = 'test-client';
process.env.COGNITO_REGION = 'us-east-1';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.S3_BUCKET = 'rim-test';
process.env.SES_FROM_ADDRESS = 'test@regaxis.local';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
