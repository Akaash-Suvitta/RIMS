'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0B1929' }}>
      <Sidebar />
      {/* Main area shifts right by sidebar width — CSS variable allows sidebar collapse */}
      <div
        className="flex min-w-0 flex-1 flex-col transition-all duration-200"
        style={{ marginLeft: '228px' }}
        id="main-content"
      >
        <TopBar />
        <main
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ marginTop: '56px' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
