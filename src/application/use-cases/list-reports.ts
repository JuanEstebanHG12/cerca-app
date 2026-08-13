import { ListReportsError, ListReportsFailureReason } from '../../domain/errors/report-errors';
import { ReportsPage } from '../../domain/models/report';
import { ReportGateway } from '../ports/report-gateway';

export type ListReportsResult = { ok: true; page: ReportsPage } | { ok: false; reason: ListReportsFailureReason };

export class ListReportsUseCase {
  constructor(private readonly reportGateway: ReportGateway) {}

  async execute(cursor: string | null, accessToken: string): Promise<ListReportsResult> {
    try {
      const page = await this.reportGateway.listOpen(cursor, accessToken);
      return { ok: true, page };
    } catch (error) {
      if (error instanceof ListReportsError) return { ok: false, reason: error.reason };
      return { ok: false, reason: 'unexpected_error' };
    }
  }
}
