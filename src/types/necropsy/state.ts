/**
 * Redux state types for the Necropsy module
 */

import {
  NecropsyCenter,
  NecropsyStats,
  AnimalNecropsyItem,
  SpeciesNecropsyItem,
  SelectOption,
  WeightUnitOption
} from './models'

// ==================== View & Filter Types ====================

export type ViewType = 'animals' | 'species'

export type ActiveCard = 'INCOMING' | 'PENDING' | 'DRAFT' | 'COMPLETED' | 'CARCASS_TRANSFER'

// ==================== Filter Types ====================

export interface NecropsyFilters {
  page: number
  limit: number
  q: string
}

export interface DateFilter {
  startDate: string | Date | null
  endDate: string | Date | null
}

export interface AnimalFilters {
  Sex: string[]
  Site: (string | number)[]
  Priority: string
  'Necropsy Location': string[]
  'Necropsy Conducted By': (string | number)[]
  'Created By': (string | number)[]
}

export interface SpeciesFilters {
  Site: (string | number)[]
  Priority: string
}

// ==================== Necropsy Slice State ====================

export interface NecropsyState {
  // Selected necropsy center
  selectedCenter: NecropsyCenter | null

  // Necropsy centers list
  centers: NecropsyCenter[]
  centersLoading: boolean
  centersError: string | null
  hasCompletedInitialFetch: boolean
  hasNoNecropsiesOnInitialFetch: boolean

  // Stats
  stats: NecropsyStats
  statsLoading: boolean
  statsError: string | null

  // Animal list
  animalList: AnimalNecropsyItem[]
  animalTotal: number
  animalLoading: boolean
  animalError: string | null

  // Species list
  speciesList: SpeciesNecropsyItem[]
  speciesTotal: number
  speciesLoading: boolean
  speciesError: string | null

  // UI state
  activeCard: ActiveCard
  viewType: ViewType

  // Filters
  filters: NecropsyFilters
  filterDate: DateFilter
  animalFilters: AnimalFilters
  speciesFilters: SpeciesFilters

  // Request tracking
  lastRequestId: string | null
}

// ==================== Form Options Slice State ====================

export interface FormOptionsState {
  mannerOfDeathOptions: SelectOption[]
  disposalOptions: SelectOption[]
  weightUnitOptions: WeightUnitOption[]
  loading: boolean
  error: string | null
  isLoaded: boolean
  lastFetchTime: number | null
}

// ==================== Combined Necropsy Module State ====================

export interface NecropsyModuleState {
  necropsy: NecropsyState
  necropsyFormOptions: FormOptionsState
}

// ==================== Async Thunk Payloads ====================

export interface FetchCentersPayload {
  userId: number
  searchQuery?: string
}

export interface FetchNecropsyDataPayload {
  statsParams: {
    necropsy_center_id: number
    from_date?: string | null
    til_date?: string | null
    type?: ViewType
    use_case?: string
  }
  listParams: {
    page_no?: number
    limit?: number
    q?: string
    from_date?: string | null
    to_date?: string | null
    til_date?: string | null
    status?: string
    necropsy_center_id?: number
    use_case?: string
    site_id?: string
    priority?: string
    sex_type?: string
    necropsy_on_site?: string
    necropsy_conducted_by?: string
    created_by?: string
  }
  viewType: ViewType
}

// ==================== Async Thunk Results ====================

export interface FetchListResult {
  list: AnimalNecropsyItem[] | SpeciesNecropsyItem[]
  total: number
}

export interface FetchStatsResult {
  INCOMING: number
  PENDING: number
  DRAFT: number
  COMPLETED: number
  CARCASS_TRANSFER: number
}

export interface FetchFormOptionsResult {
  mannerOfDeathOptions: SelectOption[]
  disposalOptions: SelectOption[]
  weightUnitOptions: WeightUnitOption[]
  cached: boolean
}

// ==================== Action Payloads ====================

export interface SetFiltersPayload {
  page?: number
  limit?: number
  q?: string
}

export interface PaginationModel {
  page: number
  pageSize: number
}
