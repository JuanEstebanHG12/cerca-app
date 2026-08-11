import { API_BASE_URL } from '../config/env';
import { ApiError, NetworkError } from './api-errors';

interface ProblemDetails {
  code?: string;
  detail?: string;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch (cause) {
    // No response at all: offline, wrong host, server down. Not the same failure as a 4xx.
    throw new NetworkError(cause);
  }

  // 204 No Content (e.g. sign-out) has no body to parse.
  const body: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined);

  if (!response.ok) {
    const problem = (body ?? {}) as ProblemDetails;
    throw new ApiError(response.status, problem.code ?? 'UNKNOWN', problem.detail ?? response.statusText);
  }

  return body as T;
}

// Thin fetch wrapper, nothing more: no caching, no retries. Callers own response validation —
// this only speaks HTTP, it doesn't know what a Session or an Actor is.
export const httpClient = {
  post: <T>(path: string, payload: unknown, accessToken?: string): Promise<T> =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }),
  get: <T>(path: string, accessToken?: string): Promise<T> =>
    request<T>(path, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    }),
};
