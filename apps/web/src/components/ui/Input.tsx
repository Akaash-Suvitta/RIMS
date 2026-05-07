'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, id, className = '', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium"
            style={{ color: '#E8F0F8' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-field ${className}`}
          style={error ? { borderColor: 'rgba(244, 63, 94, 0.5)' } : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs" style={{ color: '#F43F5E' }}>
            {error}
          </p>
        )}
        {!error && helpText && (
          <p id={`${inputId}-help`} className="mt-1 text-xs" style={{ color: '#7A9BBD' }}>
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
