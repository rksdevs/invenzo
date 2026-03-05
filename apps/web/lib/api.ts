const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

export interface ApiError extends Error {
  status?: number;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.get('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : typeof payload?.message === 'string'
        ? payload.message
        : 'Request failed';
    const err = new Error(message) as ApiError;
    err.status = response.status;
    throw err;
  }

  return response.json() as Promise<T>;
}
