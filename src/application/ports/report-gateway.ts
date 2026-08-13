import { CreateReportInput, Report, ReportsPage, ResolveReportInput } from '../../domain/models/report';

// Port: the application knows it can report a listing, list the open queue, and resolve one
// entry. It has no idea `create`/`resolve` are POSTs or that `listOpen` is cursor-paginated —
// that lives behind ReportApiGateway in src/infrastructure/api.
export interface ReportGateway {
  create(listingId: string, input: CreateReportInput, accessToken: string): Promise<Report>;
  // Always server-side filtered to status: 'open' (cerca-api's PrismaReportRepository.listOpen)
  // — there's no way to ask for resolved/dismissed reports through this endpoint.
  listOpen(cursor: string | null, accessToken: string): Promise<ReportsPage>;
  resolve(id: string, input: ResolveReportInput, accessToken: string): Promise<Report>;
}
