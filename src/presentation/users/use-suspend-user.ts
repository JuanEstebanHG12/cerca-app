import { useMutation } from '@tanstack/react-query';
import { SuspendUserUseCase } from '../../application/use-cases/suspend-user';
import { UserApiGateway } from '../../infrastructure/api/user-api-gateway';
import { useAuth } from '../auth/auth-context';

const suspendUser = new SuspendUserUseCase(new UserApiGateway());

// No cache to invalidate on success: there's no GET /users query in this app (the endpoint
// doesn't exist), so there's nothing cached that a suspension would make stale.
export function useSuspendUser() {
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!accessToken) return { ok: false as const, reason: 'unexpected_error' as const };
      return suspendUser.execute(userId, accessToken);
    },
  });
}
