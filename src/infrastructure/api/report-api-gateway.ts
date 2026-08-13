import { ReportGateway } from '../../application/ports/report-gateway';
import { CreateReportError, ListReportsError, ResolveReportError } from '../../domain/errors/report-errors';
import {
  CreateReportInput,
  Report,
  reportSchema,
  ReportsPage,
  reportsPageSchema,
  ResolveReportInput,
} from '../../domain/models/report';
import { ApiError, NetworkError } from './api-errors';
import { httpClient } from './http-client';

export class ReportApiGateway implements ReportGateway {
  async create(listingId: string, input: CreateReportInput, accessToken: string): Promise<Report> {
    let raw: unknown;
    try {
      raw = await httpClient.post<unknown>(`/listings/${listingId}/report`, input, accessToken);
    } catch (error) {
      if (__DEV__) {
        console.warn(
          '[create-report] request failed:',
          error instanceof ApiError ? `${error.status} ${error.code} ${error.message}` : error,
        );
      }
      if (error instanceof ApiError) {
        if (error.status === 404) throw new CreateReportError('not_found', error.message);
        if (error.status === 422 || error.status === 400) throw new CreateReportError('validation_error', error.message);
        throw new CreateReportError('unexpected_error', error.message);
      }
      if (error instanceof NetworkError) throw new CreateReportError('network_error', error.message);
      throw new CreateReportError('unexpected_error', error instanceof Error ? error.message : undefined);
    }

    // Split from the request try/catch on purpose: a ZodError here is neither an ApiError nor a
    // NetworkError, so before this split it silently fell into the generic 'unexpected_error'
    // branch above with no trace of *why* — the exact blind spot that cost a full manual test
    // session in US-02 §6 and US-03 §1.4 (hallazgo 3).
    const parsed = reportSchema.safeParse(raw);
    if (!parsed.success) {
      if (__DEV__) {
        console.warn('[create-report] response failed schema validation:', parsed.error.message, JSON.stringify(raw));
      }
      throw new CreateReportError('unexpected_error', 'La respuesta del servidor no tiene el formato esperado.');
    }
    return parsed.data;
  }

  async listOpen(cursor: string | null, accessToken: string): Promise<ReportsPage> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    const query = params.toString();

    try {
      const raw = await httpClient.get<unknown>(`/reports${query ? `?${query}` : ''}`, accessToken);
      return reportsPageSchema.parse(raw);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) throw new ListReportsError('no_capacity', error.message);
        throw new ListReportsError('unexpected_error', error.message);
      }
      if (error instanceof NetworkError) throw new ListReportsError('network_error', error.message);
      throw new ListReportsError('unexpected_error', error instanceof Error ? error.message : undefined);
    }
  }

  async resolve(id: string, input: ResolveReportInput, accessToken: string): Promise<Report> {
    try {
      const raw = await httpClient.post<unknown>(`/reports/${id}/resolve`, input, accessToken);
      return reportSchema.parse(raw);
    } catch (error) {
      throw toResolveReportError(error);
    }
  }
}

function toResolveReportError(error: unknown): ResolveReportError {
  if (error instanceof ApiError) {
    if (error.status === 403) return new ResolveReportError('no_capacity', error.message);
    if (error.status === 404) return new ResolveReportError('not_found', error.message);
    // REPORT_ALREADY_RESOLVED is a 409 identified by `code`, not `reason` — same family as
    // booking-api-gateway.ts's IDEMPOTENCY_IN_PROGRESS: a state conflict the use-case raises
    // before any reason-bearing policy runs, not a business-rule rejection with a `reason`.
    if (error.code === 'REPORT_ALREADY_RESOLVED') return new ResolveReportError('already_resolved', error.message);
    if (error.status === 422 || error.status === 400) return new ResolveReportError('validation_error', error.message);
    return new ResolveReportError('unexpected_error', error.message);
  }
  if (error instanceof NetworkError) return new ResolveReportError('network_error', error.message);
  return new ResolveReportError('unexpected_error', error instanceof Error ? error.message : undefined);
}
