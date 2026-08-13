import { CreateReportError, CreateReportFailureReason } from '../../domain/errors/report-errors';
import { CreateReportInput, Report } from '../../domain/models/report';
import { ReportGateway } from '../ports/report-gateway';

export type CreateReportResult = { ok: true; report: Report } | { ok: false; reason: CreateReportFailureReason };

export class CreateReportUseCase {
  constructor(private readonly reportGateway: ReportGateway) {}

  async execute(listingId: string, input: CreateReportInput, accessToken: string): Promise<CreateReportResult> {
    try {
      const report = await this.reportGateway.create(listingId, input, accessToken);
      return { ok: true, report };
    } catch (error) {
      if (error instanceof CreateReportError) return { ok: false, reason: error.reason };
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
