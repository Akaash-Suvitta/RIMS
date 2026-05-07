'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative z-10 w-full ${sizeMap[size]} rounded-2xl`}
        style={{
          backgroundColor: '#112238',
          border: '1px solid rgba(56, 189, 248, 0.20)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.12)' }}
        >
          <h2
            id="modal-title"
            className="text-lg font-semibold"
            style={{ color: '#E8F0F8', fontFamily: 'DM Serif Display, serif' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" style={{ color: '#7A9BBD' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-4"
            style={{ borderTop: '1px solid rgba(56, 189, 248, 0.12)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
