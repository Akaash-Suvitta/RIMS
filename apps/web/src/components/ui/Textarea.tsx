'use client';

import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, id, className = '', ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium"
            style={{ color: '#E8F0F8' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={`input-field resize-y ${className}`}
          style={error ? { borderColor: 'rgba(244, 63, 94, 0.5)' } : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs" style={{ color: '#F43F5E' }}>
            {error}
          </p>
        )}
        {!error && helpText && (
          <p className="mt-1 text-xs" style={{ color: '#7A9BBD' }}>
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
