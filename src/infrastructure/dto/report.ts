export type ReportResolutionAction = 'remove' | 'dismiss';

export interface CreateReportApiRequestDto {
  reason: string;
}

export interface ResolveReportApiRequestDto {
  action: ReportResolutionAction;
  note?: string;
}
