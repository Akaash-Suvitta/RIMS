'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { post } from '../../../lib/api';
import type { User } from '@rim/types';

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

interface LoginResponse {
  accessToken: string;
  user: User;
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const response = await post<LoginResponse>('/api/v1/auth/login', values);
      login(response.accessToken, response.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setServerError(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium"
          style={{ color: '#E8F0F8' }}
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="input-field"
          placeholder="you@example.com"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-xs" style={{ color: '#F43F5E' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium"
          style={{ color: '#E8F0F8' }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="input-field"
          placeholder="••••••••"
          {...register('password')}
        />
        {errors.password && (
          <p className="mt-1 text-xs" style={{ color: '#F43F5E' }}>
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#F43F5E' }}
        >
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
        style={{ marginTop: '0.25rem' }}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: '#0B1929' }} />
            Signing in…
          </span>
        ) : (
          'Sign in'
        )}
      </button>

      <p className="text-center text-xs" style={{ color: '#7A9BBD' }}>
        Contact your administrator if you need access.
      </p>
    </form>
  );
}
