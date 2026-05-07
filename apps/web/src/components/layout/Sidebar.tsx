'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Globe, RefreshCw, FileText, BookOpen,
  FolderOpen, Tag, Brain, BarChart2, Archive,
  ChevronLeft, ChevronRight, LogOut, Bell,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Registrations',
    items: [
      { label: 'Registrations', href: '/registrations', icon: <Globe className="h-4 w-4" /> },
      { label: 'Renewals', href: '/renewals', icon: <RefreshCw className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Submissions',
    items: [
      { label: 'Submissions', href: '/submissions', icon: <FileText className="h-4 w-4" /> },
      { label: 'Dossiers', href: '/dossiers', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Documents', href: '/documents', icon: <FolderOpen className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'AI Intelligence', href: '/ai', icon: <Brain className="h-4 w-4" /> },
      { label: 'Analytics', href: '/analytics', icon: <BarChart2 className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Labeling', href: '/labeling', icon: <Tag className="h-4 w-4" /> },
      { label: 'Archive', href: '/archive', icon: <Archive className="h-4 w-4" /> },
    ],
  },
];

const SIDEBAR_COLLAPSED_KEY = 'rim_sidebar_collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const sidebarWidth = collapsed ? '56px' : '228px';

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-full flex-col transition-all duration-200"
      style={{
        width: sidebarWidth,
        backgroundColor: '#112238',
        borderRight: '1px solid rgba(56, 189, 248, 0.12)',
      }}
    >
      {/* Logo */}
      <div
        className="flex h-14 items-center px-3"
        style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.12)' }}
      >
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #00C2A8)', color: '#0B1929' }}
        >
          RA
        </div>
        {!collapsed && (
          <span
            className="ml-2.5 text-sm font-semibold whitespace-nowrap"
            style={{ color: '#E8F0F8', fontFamily: 'DM Serif Display, serif' }}
          >
            RegAxis RIM
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <p
                className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#4A6A8A' }}
              >
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mx-1.5 mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
                  style={{
                    color: active ? '#00C2A8' : '#7A9BBD',
                    backgroundColor: active ? 'rgba(26, 51, 80, 0.8)' : 'transparent',
                    borderLeft: active ? '2px solid #00C2A8' : '2px solid transparent',
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  )}
                  {!collapsed && item.badge != null && item.badge > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#F43F5E' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section + collapse toggle */}
      <div style={{ borderTop: '1px solid rgba(56, 189, 248, 0.12)' }}>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-3">
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: '#00C2A8', color: '#0B1929' }}
            >
              {user.firstName?.[0] ?? user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium" style={{ color: '#E8F0F8' }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs" style={{ color: '#4A6A8A' }}>
                {user.role.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded p-1 transition-colors hover:bg-white/10"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" style={{ color: '#4A6A8A' }} />
            </button>
          </div>
        )}

        <div className="flex justify-end px-2 pb-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" style={{ color: '#4A6A8A' }} />
            ) : (
              <ChevronLeft className="h-4 w-4" style={{ color: '#4A6A8A' }} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
