'use client';

import { ProtectedRoute } from '../../lib/auth';
import { AppShell } from '../../components/layout/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
