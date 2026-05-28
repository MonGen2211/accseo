export interface TrendingSyncSchedule {
  id: string;
  hours: number; // enum [4, 24, 48, 168]
  cronExpr: string;
  geo?: string;
  hl?: string;
  enabled: boolean;
  isRunning: boolean;
  runningStartedAt: string | null;
  lastRunAt: string | null;
  lastStatus: 'success' | 'error' | 'skipped' | null;
  lastError: string | null;
  lastDurationMs: number | null;
  lastSyncedCount: number | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrendingSyncScheduleDto {
  hours: number;
  cronExpr: string;
  enabled?: boolean;
}

export interface UpdateTrendingSyncScheduleDto {
  cronExpr?: string;
  enabled?: boolean;
}
