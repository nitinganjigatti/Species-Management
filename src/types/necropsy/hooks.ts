/**
 * Hook return types for the Necropsy module
 */

import { SyntheticEvent } from 'react'
import {
  NecropsyCenter,
  NecropsyStats,
  AnimalNecropsyItem,
  SpeciesNecropsyItem,
  IndexedAnimalRow,
  IndexedSpeciesRow,
  SelectOption,
  WeightUnitOption
} from './models'
import {
  ViewType,
  ActiveCard,
  NecropsyFilters,
  DateFilter,
  AnimalFilters,
  SpeciesFilters,
  PaginationModel
} from './state'

// ==================== useNecropsyCenter Hook ====================

export interface UseNecropsCenterParams {
  userId: number
  autoFetch?: boolean
}

export interface UseNecropsCenterReturn {
  // Data
  selectedCenter: NecropsyCenter | null
  centers: NecropsyCenter[]
  centersLoading: boolean

  // Actions
  fetchCenters: (searchQuery?: string) => void
  updateSelectedCenter: (center: NecropsyCenter | null) => void
  clearData: () => void
}

// ==================== useNecropsyFormOptions Hook ====================

export interface UseNecropsyFormOptionsParams {
  autoFetch?: boolean
}

export interface UseNecropsyFormOptionsReturn {
  // Options data
  mannerOfDeathOptions: SelectOption[]
  disposalOptions: SelectOption[]
  weightUnitOptions: WeightUnitOption[]

  // Loading state
  loading: boolean
  isLoaded: boolean
  error: string | null

  // Actions
  fetchOptions: () => void

  // Helpers
  findMannerOfDeathOption: (idOrName: string | number | null | undefined) => SelectOption | null
  findDisposalOption: (idOrName: string | number | null | undefined) => SelectOption | null
  findWeightUnitOption: (idOrAbbr: string | number | null | undefined) => WeightUnitOption | null
}

// ==================== useNecropsyList Hook ====================

export interface UseNecropsyListReturn {
  // Data
  selectedNecropsy: NecropsyCenter | null
  stats: NecropsyStats
  statsLoading: boolean
  animalList: AnimalNecropsyItem[]
  animalTotal: number
  animalLoading: boolean
  speciesList: SpeciesNecropsyItem[]
  speciesTotal: number
  speciesLoading: boolean
  isLoading: boolean

  // Indexed rows (memoized)
  indexedAnimalRows: IndexedAnimalRow[]
  indexedSpeciesRows: IndexedSpeciesRow[]

  // UI State
  activeCard: ActiveCard
  viewType: ViewType
  filters: NecropsyFilters
  filterDate: DateFilter
  animalFilters: AnimalFilters
  speciesFilters: SpeciesFilters
  animalFilterCount: number
  speciesFilterCount: number

  // Actions
  fetchAll: () => void
  fetchStats: () => void
  fetchNecropsyData: () => Promise<void>
  handleSearch: (value: string) => void
  handleSearchClear: () => void
  handlePaginationChange: (model: PaginationModel) => void
  handleActiveCardChange: (cardId: ActiveCard) => void
  handleViewTypeChange: (event: SyntheticEvent, newValue: ViewType | null) => void
  handleDateFilterChange: (dateRange: DateFilter) => void
  applyAnimalFilters: (selectedOptions: AnimalFilters) => void
  applySpeciesFilters: (selectedOptions: SpeciesFilters) => void
}

// ==================== Hook Factory Types ====================

export type UseNecropsyCenter = (userId: number, autoFetch?: boolean) => UseNecropsCenterReturn

export type UseNecropsyFormOptions = (autoFetch?: boolean) => UseNecropsyFormOptionsReturn

export type UseNecropsyList = () => UseNecropsyListReturn
