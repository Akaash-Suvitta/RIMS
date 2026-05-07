'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: boolean;
}

export function Card({ children, className = '', style, padding = true }: CardProps) {
  return (
    <div
      className={`rounded-xl ${padding ? 'p-4' : ''} ${className}`}
      style={{
        backgroundColor: '#112238',
        border: '1px solid rgba(56, 189, 248, 0.12)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#E8F0F8' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm" style={{ color: '#7A9BBD' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
