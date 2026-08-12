import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../../infrastructure/api/api-errors';

// Retrying a denied permission three times is an antipattern (Cerca.md) — a 401/403 won't
// start succeeding on attempt two. Everything else (network blips, 5xx) gets React Query's
// default retry behaviour.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return false;
  }
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 60_000,
    },
    mutations: {
      retry: false,
    },
  },
});
