'use client';

import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties & { className?: string }> = {
  primary: {
    backgroundColor: '#00C2A8',
    color: '#0B1929',
    fontWeight: 600,
  },
  secondary: {
    backgroundColor: '#112238',
    color: '#E8F0F8',
    border: '1px solid rgba(56, 189, 248, 0.20)',
  },
  danger: {
    backgroundColor: '#F43F5E',
    color: '#ffffff',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#7A9BBD',
  },
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...rest}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: variant === 'primary' ? '#0B1929' : '#E8F0F8' }}
        />
      )}
      {children}
    </button>
  );
}
