'use client';

import type { Metadata } from 'next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './globals.css';

// Note: metadata export is handled separately in a server component wrapper.
// This layout uses 'use client' to enable the QueryClientProvider.

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Create the QueryClient inside a useState so it is stable across re-renders
  // and not shared between different users on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      }),
  );

  return (
    <html lang="en" className="dark">
      <head>
        <title>RegAxis RIM</title>
        <meta name="description" content="Regulatory Information Management platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-navy-900 text-slate-100 antialiased">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
