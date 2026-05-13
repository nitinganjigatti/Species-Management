/**
 * Redux / Context state types for the Hospital module.
 */

import { Hospital, HospitalAnalytics } from './models'

// ==================== Redux Slice ====================

export interface HospitalSliceState {
  data: Record<string, unknown>
}

export interface UpdateStatePayload {
  key: string
  value: unknown
}

// ==================== HospitalContext ====================

export interface HospitalContextValue {
  selectedHospital: Hospital | null
  hospitals: Hospital[]
  hospitalStats: HospitalAnalytics | null
  isHospitalStatsLoading: boolean
  hasFetchedStatsForCurrentHospital: boolean
  isHospitalAccessChecked: boolean
  hasNoHospitalsOnInitialFetch: boolean
  hasCompletedInitialFetch: boolean
  updateSelectedHospital: (hospital: Hospital | null) => void
  updateHospitals: (newHospitals: Hospital[], append?: boolean) => void
  updateHospitalStats: (stats: HospitalAnalytics | null) => void
  setHospitalStatsLoading: (loading: boolean) => void
  setIsHospitalAccessChecked: (checked: boolean) => void
  markStatsAsFetched: () => void
  markInitialFetchComplete: (hospitalsCount: number) => void
  clearHospitalData: () => void
}
