import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  env: {
    // Expose the API URL to server components and API routes.
    // On Vercel this is set as an environment variable; locally it defaults to
    // the Express dev server.
    API_URL: process.env.API_URL ?? 'http://localhost:3001',
  },

  // Proxy /api/v1/* requests to the Express backend during development
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
