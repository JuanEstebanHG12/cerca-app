import { ResolveReportError, ResolveReportFailureReason } from '../../domain/errors/report-errors';
import { Report, ResolveReportInput } from '../../domain/models/report';
import { ReportGateway } from '../ports/report-gateway';

export type ResolveReportResult = { ok: true; report: Report } | { ok: false; reason: ResolveReportFailureReason };

export class ResolveReportUseCase {
  constructor(private readonly reportGateway: ReportGateway) {}

  async execute(id: string, input: ResolveReportInput, accessToken: string): Promise<ResolveReportResult> {
    try {
      const report = await this.reportGateway.resolve(id, input, accessToken);
      return { ok: true, report };
    } catch (error) {
      if (error instanceof ResolveReportError) return { ok: false, reason: error.reason };
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
