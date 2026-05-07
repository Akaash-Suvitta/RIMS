'use client';

type BadgeVariant = 'active' | 'pending' | 'expired' | 'draft' | 'in_progress' | 'warning' | 'info' | 'ai';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  active:      { bg: 'rgba(16,185,129,0.12)',   color: '#10B981', border: 'rgba(16,185,129,0.3)'  },
  pending:     { bg: 'rgba(245,158,11,0.12)',   color: '#F59E0B', border: 'rgba(245,158,11,0.3)'  },
  expired:     { bg: 'rgba(244,63,94,0.12)',    color: '#F43F5E', border: 'rgba(244,63,94,0.3)'   },
  draft:       { bg: 'rgba(74,106,138,0.20)',   color: '#7A9BBD', border: 'rgba(74,106,138,0.3)'  },
  in_progress: { bg: 'rgba(56,189,248,0.12)',   color: '#38BDF8', border: 'rgba(56,189,248,0.3)'  },
  warning:     { bg: 'rgba(245,158,11,0.12)',   color: '#F59E0B', border: 'rgba(245,158,11,0.3)'  },
  info:        { bg: 'rgba(56,189,248,0.12)',   color: '#38BDF8', border: 'rgba(56,189,248,0.3)'  },
  ai:          { bg: 'rgba(167,139,250,0.12)',  color: '#A78BFA', border: 'rgba(167,139,250,0.3)' },
};

export function Badge({ variant = 'draft', children, className = '' }: BadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}

// Map API status strings to Badge variants
export function statusToBadgeVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'uploaded':
    case 'complete':
      return 'active';
    case 'pending':
    case 'upcoming':
    case 'review':
      return 'pending';
    case 'expired':
    case 'lapsed':
    case 'rejected':
    case 'missed':
    case 'overdue':
      return 'expired';
    case 'in_progress':
    case 'under_review':
    case 'submitted':
    case 'in_preparation':
      return 'in_progress';
    case 'draft':
    case 'not_started':
    case 'planned':
      return 'draft';
    case 'suspended':
    case 'gap_identified':
      return 'warning';
    default:
      return 'draft';
  }
}
