/**
 * Dashboard API types
 * Used by: src/lib/api/dashboard/index.ts
 */

import type {
  DashboardStatItem,
  KeyInsightItem,
  ChartDataItem,
  AnimalTransfer,
  PendingRequests,
  PharmacySlide,
  LabRequests
} from '../models'

// ── Request params ─────────────────────────────────────────────────────────────

export interface DashboardRequestParams {
  params?: Record<string, unknown>
}

// ── Response types ─────────────────────────────────────────────────────────────

export type GetDashboardAnalyticsResponse = DashboardStatItem[]
export type GetKeyInsightsResponse = KeyInsightItem[]
export type GetEggAnalyticsResponse = ChartDataItem[]
export type GetAnimalActivityResponse = ChartDataItem[]
export type GetAnimalTransferResponse = AnimalTransfer
export type GetPendingRequestsResponse = PendingRequests
export type GetDashboardPharmacyResponse = PharmacySlide[]
export type GetNotesResponse = ChartDataItem[]
export type GetLabRequestsResponse = LabRequests
