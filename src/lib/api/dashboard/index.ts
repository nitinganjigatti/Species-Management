import { axiosGet } from '../utility'
import type { DashboardRequestParams } from 'src/types/dashboard/api'
import type {
  DashboardStatItem,
  KeyInsightItem,
  ChartDataItem,
  AnimalTransfer,
  PendingRequests,
  PharmacySlide,
  LabRequests
} from 'src/types/dashboard/models'

export async function getDashboardAnalytics({ params }: DashboardRequestParams): Promise<DashboardStatItem[]> {
  const response = await axiosGet({ url: 'v1/dashboard/stats', params })
  return response.data
}

export async function getKeyInsights({ params }: DashboardRequestParams): Promise<KeyInsightItem[]> {
  const response = await axiosGet({ url: 'v1/dashboard/key/insights', params })
  return response.data
}

export async function getEggAnalytics({ params }: DashboardRequestParams): Promise<ChartDataItem[]> {
  const response = await axiosGet({ url: 'v1/dashboard/egg/insights', params })
  return response.data
}

export async function getAnimalActivity({ params }: DashboardRequestParams): Promise<ChartDataItem[]> {
  const response = await axiosGet({ url: 'v1/dashboard/animal/key/insights', params })
  return response.data
}

export async function getAnimalTransfer({ params }: DashboardRequestParams): Promise<AnimalTransfer> {
  const response = await axiosGet({ url: 'v1/dashboard/animal/transfer/insights', params })
  return response.data
}

export async function getPendingRequests({ params }: DashboardRequestParams): Promise<PendingRequests> {
  const response = await axiosGet({ url: 'v1/dashboard/pharma/stats', params })
  return response.data
}

export async function getDashboardPharmacy({ params }: DashboardRequestParams): Promise<PharmacySlide[]> {
  const response = await axiosGet({ url: 'v1/dashboard/overall/module/stats', params })
  return response.data
}

export async function getNotes({ params }: DashboardRequestParams): Promise<ChartDataItem[]> {
  const response = await axiosGet({ url: 'v1/dashboard/notes/stats', params })
  return response.data
}

export async function getLabRequests({ params }: DashboardRequestParams): Promise<LabRequests> {
  const response = await axiosGet({ url: 'v1/dashboard/lab/stats', params })
  return response.data
}
