import { useMutation } from '@tanstack/react-query';
import { CreateReportUseCase } from '../../application/use-cases/create-report';
import { CreateReportInput } from '../../domain/models/report';
import { ReportApiGateway } from '../../infrastructure/api/report-api-gateway';
import { useAuth } from '../auth/auth-context';

const createReport = new CreateReportUseCase(new ReportApiGateway());

export function useCreateReport(listingId: string) {
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      if (!accessToken) {
        // Can't happen through the UI (ReportListingButton only renders inside a signed-in
        // route group) — same defensive shape as useCreateListing's equivalent guard.
        return { ok: false as const, reason: 'unexpected_error' as const };
      }
      return createReport.execute(listingId, input, accessToken);
    },
  });
}
