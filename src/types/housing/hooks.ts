/**
 * Hook return types for the Housing module
 */

import { SyntheticEvent } from 'react'
import {
  Site,
  SiteAnalytics,
  Section,
  SectionAnalytics,
  Enclosure,
  EnclosureStats,
  Animal,
  AnimalOverview,
  Species,
  Cluster,
  ClusterAnalytics,
  Note,
  Mortality,
  Treatment,
  Media,
  AnimalIdentifier,
  AnimalIncident,
  AnimalDiet,
  AnimalHistoryItem,
  AnimalJournalLog,
  ObservationType,
  ObservationMasterItem,
  SelectOption,
  User
} from './models'
import {
  SiteFilters,
  SectionFilters,
  NotesFilters,
  PaginationModel
} from './state'

// ==================== useSiteAnalytics Hook ====================

export interface UseSiteAnalyticsParams {
  siteId: number | string
  autoFetch?: boolean
}

export interface UseSiteAnalyticsReturn {
  data: SiteAnalytics | null
  loading: boolean
  error: string | null
  refetch: () => void
  clearData: () => void
}

// ==================== useSectionAnalytics Hook ====================

export interface UseSectionAnalyticsParams {
  sectionId: number | string
  autoFetch?: boolean
}

export interface UseSectionAnalyticsReturn {
  data: SectionAnalytics | null
  loading: boolean
  error: string | null
  refetch: () => void
  clearData: () => void
}

// ==================== useSiteList Hook ====================

export interface UseSiteListReturn {
  sites: Site[]
  total: number
  loading: boolean
  error: string | null
  filters: SiteFilters
  handleSearch: (value: string) => void
  handlePaginationChange: (model: PaginationModel) => void
  handleSortChange: (sortModel: Array<{ field: string; sort: 'asc' | 'desc' }>) => void
  refetch: () => void
}

// ==================== useSectionList Hook ====================

export interface UseSectionListParams {
  siteId?: number | string
}

export interface UseSectionListReturn {
  sections: Section[]
  total: number
  loading: boolean
  error: string | null
  filters: SectionFilters
  handleSearch: (value: string) => void
  handlePaginationChange: (model: PaginationModel) => void
  handleSortChange: (sortModel: Array<{ field: string; sort: 'asc' | 'desc' }>) => void
  refetch: () => void
  clearSections: () => void
}

// ==================== useSpeciesList Hook ====================

export interface UseSpeciesListParams {
  siteId?: number | string
  sectionId?: number | string
  enclosureId?: number | string
}

export interface UseSpeciesListReturn {
  species: Species[]
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  handleSearch: (value: string) => void
  handleLoadMore: () => void
  refetch: () => void
  resetList: () => void
}

// ==================== useAnimalList Hook ====================

export interface UseAnimalListParams {
  siteId?: number | string
  sectionId?: number | string
  enclosureId?: number | string
}

export interface UseAnimalListReturn {
  animals: Animal[]
  total: number
  loading: boolean
  error: string | null
  hasMore: boolean
  handleSearch: (value: string) => void
  handleLoadMore: () => void
  refetch: () => void
  resetList: () => void
}

// ==================== useEnclosureList Hook ====================

export interface UseEnclosureListParams {
  sectionId?: number | string
  siteId?: number | string
}

export interface UseEnclosureListReturn {
  enclosures: Enclosure[]
  total: number
  loading: boolean
  error: string | null
  handleSearch: (value: string) => void
  handlePaginationChange: (model: PaginationModel) => void
  refetch: () => void
  clearEnclosures: () => void
}

// ==================== useClusterList Hook ====================

export interface UseClusterListReturn {
  clusters: Cluster[]
  total: number
  loading: boolean
  error: string | null
  handleSearch: (value: string) => void
  handlePaginationChange: (model: PaginationModel) => void
  refetch: () => void
}

// ==================== useAnimalDetails Hook ====================

export interface UseAnimalDetailsParams {
  animalId: number | string
}

export interface UseAnimalDetailsReturn {
  animal: AnimalOverview | null
  loading: boolean
  error: string | null
  refetch: () => void
}

// ==================== useAnimalIdentifiers Hook ====================

export interface UseAnimalIdentifiersParams {
  animalId: number | string
}

export interface UseAnimalIdentifiersReturn {
  identifiers: AnimalIdentifier[]
  loading: boolean
  error: string | null
  refetch: () => void
  addIdentifier: (data: Record<string, unknown>) => Promise<boolean>
  editIdentifier: (data: Record<string, unknown>) => Promise<boolean>
  deleteIdentifier: (identifierId: number) => Promise<boolean>
}

// ==================== useAnimalIncidents Hook ====================

export interface UseAnimalIncidentsParams {
  animalId: number | string
}

export interface UseAnimalIncidentsReturn {
  incidents: AnimalIncident[]
  loading: boolean
  error: string | null
  refetch: () => void
  createIncident: (data: Record<string, unknown>) => Promise<boolean>
  updateIncident: (data: Record<string, unknown>) => Promise<boolean>
}

// ==================== useAnimalMortality Hook ====================

export interface UseAnimalMortalityParams {
  animalId: number | string
}

export interface UseAnimalMortalityReturn {
  mortality: Mortality | null
  loading: boolean
  error: string | null
  mannerOfDeathOptions: SelectOption[]
  carcassConditionOptions: SelectOption[]
  carcassDispositionOptions: SelectOption[]
  refetch: () => void
  editMortality: (data: Record<string, unknown>) => Promise<boolean>
  revokeMortality: (data: Record<string, unknown>) => Promise<boolean>
}

// ==================== useAnimalDiet Hook ====================

export interface UseAnimalDietParams {
  animalId: number | string
}

export interface UseAnimalDietReturn {
  diets: AnimalDiet[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => void
}

// ==================== useAnimalHistory Hook ====================

export interface UseAnimalHistoryParams {
  animalId: number | string
}

export interface UseAnimalHistoryReturn {
  history: AnimalHistoryItem[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => void
}

// ==================== useAnimalJournals Hook ====================

export interface UseAnimalJournalsParams {
  animalId: number | string
}

export interface UseAnimalJournalsReturn {
  journals: AnimalJournalLog[]
  loading: boolean
  error: string | null
  filters: {
    fromDate?: string
    toDate?: string
  }
  setFilters: (filters: { fromDate?: string; toDate?: string }) => void
  refetch: () => void
}

// ==================== useNotes Hook ====================

export interface UseNotesParams {
  refType: 'site' | 'section' | 'enclosure' | 'animal'
  refId: number | string
}

export interface UseNotesReturn {
  notes: Note[]
  total: number
  loading: boolean
  error: string | null
  filters: NotesFilters
  observationTypes: ObservationType[]
  observationMasterList: ObservationMasterItem[]
  users: User[]
  handleLoadMore: () => void
  handleFilterApply: (filters: NotesFilters) => void
  handleClearFilters: () => void
  handleLikeClick: (note: Note) => Promise<void>
  handleCommentSubmit: (data: { observation_id: number; notes: string }) => Promise<void>
  refetch: () => void
}

// ==================== useMortalityList Hook ====================

export interface UseMortalityListParams {
  siteId?: number | string
  sectionId?: number | string
}

export interface UseMortalityListReturn {
  mortalities: Mortality[]
  total: number
  loading: boolean
  error: string | null
  handleSearch: (value: string) => void
  handlePaginationChange: (model: PaginationModel) => void
  refetch: () => void
}

// ==================== useMediaList Hook ====================

export interface UseMediaListParams {
  siteId?: number | string
  sectionId?: number | string
  enclosureId?: number | string
  animalId?: number | string
}

export interface UseMediaListReturn {
  media: Media[]
  total: number
  loading: boolean
  error: string | null
  handleLoadMore: () => void
  refetch: () => void
}

// ==================== useTreatmentList Hook ====================

export interface UseTreatmentListParams {
  siteId?: number | string
  sectionId?: number | string
}

export interface UseTreatmentListReturn {
  treatments: Treatment[]
  total: number
  loading: boolean
  error: string | null
  handleSearch: (value: string) => void
  handlePaginationChange: (model: PaginationModel) => void
  refetch: () => void
}

// ==================== Hook Factory Types ====================

export type UseSiteAnalytics = (
  siteId: number | string,
  autoFetch?: boolean
) => UseSiteAnalyticsReturn

export type UseSectionAnalytics = (
  sectionId: number | string,
  autoFetch?: boolean
) => UseSectionAnalyticsReturn

export type UseSiteList = () => UseSiteListReturn

export type UseSectionList = (siteId?: number | string) => UseSectionListReturn

export type UseSpeciesList = (params?: UseSpeciesListParams) => UseSpeciesListReturn

export type UseAnimalList = (params?: UseAnimalListParams) => UseAnimalListReturn

export type UseEnclosureList = (params?: UseEnclosureListParams) => UseEnclosureListReturn

export type UseClusterList = () => UseClusterListReturn

export type UseAnimalDetails = (animalId: number | string) => UseAnimalDetailsReturn

export type UseAnimalIdentifiers = (animalId: number | string) => UseAnimalIdentifiersReturn

export type UseAnimalIncidents = (animalId: number | string) => UseAnimalIncidentsReturn

export type UseAnimalMortality = (animalId: number | string) => UseAnimalMortalityReturn

export type UseAnimalDiet = (animalId: number | string) => UseAnimalDietReturn

export type UseAnimalHistory = (animalId: number | string) => UseAnimalHistoryReturn

export type UseAnimalJournals = (animalId: number | string) => UseAnimalJournalsReturn

export type UseNotes = (params: UseNotesParams) => UseNotesReturn

export type UseMortalityList = (params?: UseMortalityListParams) => UseMortalityListReturn

export type UseMediaList = (params?: UseMediaListParams) => UseMediaListReturn

export type UseTreatmentList = (params?: UseTreatmentListParams) => UseTreatmentListReturn
