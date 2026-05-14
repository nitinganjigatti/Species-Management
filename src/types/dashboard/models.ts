/**
 * Core entity types for the Dashboard module
 */

// ── Stat Panel ────────────────────────────────────────────────────────────────

export interface DashboardStatItem {
  key: string
  value: number
  label: string
  bgColor?: string
  icon?: string
}

// ── Key Insights ──────────────────────────────────────────────────────────────

export interface KeyInsightItem {
  title: string
  subtitle: string
  value: number
}

// ── Shared chart label/value pair ─────────────────────────────────────────────

export interface ChartDataItem {
  label: string
  value: number
}

// ── Animal Transfer ───────────────────────────────────────────────────────────

export interface TransferProgressItem {
  title: string
  value: number
  progressPercentage: number
}

export interface AnimalTransfer {
  totalTransfers: number
  transferPercentage: number
  transferProgress: TransferProgressItem[]
}

// ── Pending Requests (Pharmacy) ───────────────────────────────────────────────

export interface PriorityStatItem {
  label: string
  value: number
}

export interface PendingRequests {
  total_requests: number
  completed_requests: number
  completed_requests_percentage: number
  priority_stats: PriorityStatItem[]
}

// ── Lab Requests ──────────────────────────────────────────────────────────────

export interface LabStatItem {
  title: string
  value: number
  percentage: number
}

export interface LabRequests {
  total_requests: number
  completed_request: number
  completed_requests_percentage: number
  lab_stats: LabStatItem[]
}

// ── Pharmacy Slider ───────────────────────────────────────────────────────────

export interface PharmacySlide {
  title: string
  subtitle: string
  title_value: number | string
  details: Record<string, number>
  img?: string
}
