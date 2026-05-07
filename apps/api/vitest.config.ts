import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      zod: path.resolve('../../node_modules/zod'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      APP_ENV: 'local',
      PORT: '3002',
      DATABASE_URL: 'postgresql://rim:rim@localhost:5432/rim_test',
      COGNITO_USER_POOL_ID: 'test-pool',
      COGNITO_CLIENT_ID: 'test-client',
      COGNITO_REGION: 'us-east-1',
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
      S3_BUCKET: 'rim-test',
      SES_FROM_ADDRESS: 'test@regaxis.local',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['node_modules', 'dist', 'src/__tests__'],
    },
  },
});
