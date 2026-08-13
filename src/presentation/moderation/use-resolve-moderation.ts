import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModerateListingUseCase } from '../../application/use-cases/moderate-listing';
import { ModerationDecision, ResolveModerationUseCase } from '../../application/use-cases/resolve-moderation';
import { ResolveReportUseCase } from '../../application/use-cases/resolve-report';
import { ListingApiGateway } from '../../infrastructure/api/listing-api-gateway';
import { ReportApiGateway } from '../../infrastructure/api/report-api-gateway';
import { useAuth } from '../auth/auth-context';
import { listingKeys } from '../listings/listing-keys';
import { reportKeys } from './report-keys';

const resolveModeration = new ResolveModerationUseCase(
  new ModerateListingUseCase(new ListingApiGateway()),
  new ResolveReportUseCase(new ReportApiGateway()),
);

export function useResolveModeration() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { reportId: string; listingId: string; decision: ModerationDecision; note: string }) => {
      if (!accessToken) {
        return { ok: false as const, stage: 'listing' as const, reason: 'unexpected_error' as const };
      }
      return resolveModeration.execute(input.reportId, input.listingId, input.decision, input.note, accessToken);
    },
    onSuccess: (result, variables) => {
      // Runs whenever the listing side actually changed — both the true-success path and the
      // "removed but couldn't close the report" partial-success path (result.ok === true
      // either way; see ResolveModerationUseCase's ResolveModerationResult).
      if (result.ok && variables.decision !== 'dismiss') {
        queryClient.invalidateQueries({ queryKey: listingKeys.detail(variables.listingId) });
        queryClient.invalidateQueries({ queryKey: listingKeys.searches() });
      }
      // The report either resolved or (for 'under_review') was deliberately left open — either
      // way the queue's own list has to be refetched to reflect it, same as US-06's booking
      // queue refetching after accept/complete.
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: reportKeys.queue() });
      }
    },
  });
}
