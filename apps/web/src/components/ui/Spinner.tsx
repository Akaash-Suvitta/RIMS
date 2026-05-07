'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function Spinner({ size = 'md', color = '#00C2A8' }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-transparent ${sizeMap[size]}`}
      style={{ borderTopColor: color }}
      role="status"
      aria-label="Loading"
    />
  );
}
