import { useInfiniteQuery } from '@tanstack/react-query';
import { ListReportsUseCase } from '../../application/use-cases/list-reports';
import { ReportApiGateway } from '../../infrastructure/api/report-api-gateway';
import { useAuth } from '../auth/auth-context';
import { reportKeys } from './report-keys';

const listReports = new ListReportsUseCase(new ReportApiGateway());

// Same useInfiniteQuery-over-a-use-case shape as useSearchListings — cursor pagination, thrown
// error carries the typed reason in `message` (ListReportsFailureReason), matching every other
// query in this app. `enabled: accessToken !== null` mirrors useSearchListings' `filters !==
// null`: there's no anonymous moderation queue, so the query simply never fires without a
// session, instead of firing and failing with a 401 first.
export function useReportQueue() {
  const { accessToken } = useAuth();

  return useInfiniteQuery({
    queryKey: reportKeys.queue(),
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      if (!accessToken) throw new Error('unexpected_error');
      const result = await listReports.execute(pageParam, accessToken);
      if (!result.ok) throw new Error(result.reason);
      return result.page;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: accessToken !== null,
    // A report resolved by another moderator a moment ago shouldn't linger in this list —
    // same reasoning as use-my-bookings.ts's staleTime: 0 for "Solicitudes recibidas".
    staleTime: 0,
  });
}
