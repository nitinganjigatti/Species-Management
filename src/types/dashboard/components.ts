/**
 * Component prop types for the Dashboard module
 */

import type { ReactNode } from 'react'
import type { Theme } from '@mui/material/styles'
import type {
  DashboardStatItem,
  KeyInsightItem,
  ChartDataItem,
  AnimalTransfer,
  PendingRequests,
  LabRequests,
  PharmacySlide
} from './models'

// ── DashboardStatsPanel ───────────────────────────────────────────────────────

export interface StatCardProps {
  icon: string
  value: number
  label: string
  bgColor: string
}

export interface DashboardStatsPanelProps {
  stats: DashboardStatItem[]
}

// ── DashboardCardHeader ───────────────────────────────────────────────────────

export interface DashboardCardHeaderProps {
  title?: string
  children?: ReactNode
  theme?: Theme
  isSmall?: boolean
}

// ── KeyInsights ───────────────────────────────────────────────────────────────

export interface KeyInsightsProps {
  insights: KeyInsightItem[]
}

// ── Charts ────────────────────────────────────────────────────────────────────

export interface AnimalActivityChartProps {
  animalActivityData: ChartDataItem[]
}

export interface AnimalTransferProgressProps {
  animalTransfer: AnimalTransfer
}

export interface EggChartProps {
  eggAnalytics: ChartDataItem[]
  height: number
}

export interface PharmacyPendingReqChartProps {
  pendingRequests: PendingRequests
}

export interface DashboardNotesProps {
  notesData: ChartDataItem[]
}

// ── DashboardPharmacyDetails ──────────────────────────────────────────────────

export interface SlidesProps {
  sliderData: PharmacySlide[]
}

export interface DashboardPharmacyDetailsProps {
  pharmacyData: PharmacySlide[]
}

// ── DashboardLabRequests ──────────────────────────────────────────────────────

export interface DashboardLabRequestsProps {
  labRequests: LabRequests
}
