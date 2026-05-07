'use client';

import type { ApiError } from '@rim/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const TOKEN_STORAGE_KEY = 'rim_access_token';

// ─── Token helpers ─────────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// ─── ApiError class ────────────────────────────────────────────────────────────

export class RimApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(apiError: ApiError, status: number) {
    super(apiError.message);
    this.name = 'RimApiError';
    this.code = apiError.code;
    this.status = status;
    this.details = apiError.details;
  }
}

// ─── Base fetch wrapper ────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for requests with a body
  if (init.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  // Handle 401: clear token and redirect to login
  if (response.status === 401) {
    clearStoredToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new RimApiError({ code: 'UNAUTHORIZED', message: 'Session expired. Please log in again.' }, 401);
  }

  // Empty response (204)
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let apiError: ApiError;
    try {
      apiError = (await response.json()) as ApiError;
    } catch {
      apiError = {
        code: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    throw new RimApiError(apiError, response.status);
  }

  return response.json() as Promise<T>;
}

// ─── Typed convenience methods ────────────────────────────────────────────────

export function get<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function del(path: string): Promise<void> {
  return apiFetch<void>(path, { method: 'DELETE' });
}

export function upload<T>(path: string, formData: FormData): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: formData,
    // No Content-Type header — browser sets it with multipart boundary
  });
}

// ─── Namespace export (backward compat) ───────────────────────────────────────

export const api = { get, post, put, patch, del, upload };
export default api;
