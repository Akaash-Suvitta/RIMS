'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../lib/auth';

function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'RegAxis RIM', href: '/dashboard' }];

  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    const label = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-14 items-center justify-between px-5"
      style={{
        left: 'var(--sidebar-width, 228px)',
        backgroundColor: '#0B1929',
        borderBottom: '1px solid rgba(56, 189, 248, 0.12)',
      }}
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <span style={{ color: '#4A6A8A' }}>/</span>
              )}
              {i === breadcrumbs.length - 1 ? (
                <span style={{ color: '#E8F0F8' }}>{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-teal" style={{ color: '#7A9BBD' }}>
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications bell */}
        <Link
          href="/notifications"
          className="relative rounded-lg p-2 transition-colors hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" style={{ color: '#7A9BBD' }} />
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/10"
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: '#00C2A8', color: '#0B1929' }}
            >
              {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {user && (
              <span className="text-sm" style={{ color: '#E8F0F8' }}>
                {user.firstName}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" style={{ color: '#7A9BBD' }} />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div
                className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl py-1"
                style={{
                  backgroundColor: '#112238',
                  border: '1px solid rgba(56, 189, 248, 0.20)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                <div className="border-b px-4 py-2" style={{ borderColor: 'rgba(56, 189, 248, 0.12)' }}>
                  <p className="text-sm font-medium" style={{ color: '#E8F0F8' }}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs" style={{ color: '#7A9BBD' }}>
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-white/10"
                  style={{ color: '#7A9BBD' }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
