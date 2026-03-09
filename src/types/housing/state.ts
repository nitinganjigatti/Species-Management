/**
 * Redux state types for the Housing module
 */

import {
  Site,
  SiteAnalytics,
  Section,
  SectionAnalytics,
  Enclosure,
  Animal,
  Species,
  Mortality,
  Treatment,
  Media,
  Note,
  ObservationType,
  ObservationMasterItem,
  User
} from './models'

// ==================== Common State Types ====================

export type SortOrder = 'asc' | 'desc'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface LoadingErrorState {
  loading: boolean
  error: string | null
}

export interface SearchSortState {
  search: string
  sortBy: string
  sortOrder: SortOrder
}

// ==================== Base List State ====================

export interface BaseListState<T> extends PaginationState, LoadingErrorState, SearchSortState {
  list: T[]
}

// ==================== Site Analytics Slice State ====================

export interface SiteAnalyticsState extends LoadingErrorState {
  data: SiteAnalytics | null
}

// ==================== Insights Slice State ====================

export interface InsightsState extends LoadingErrorState {
  data: SectionAnalytics | null
}

// ==================== Section Slice State ====================

export interface SectionState extends BaseListState<Section> {}

// ==================== Species Slice State ====================

export interface SpeciesState extends BaseListState<Species> {}

// ==================== Mortality Slice State ====================

export interface MortalityState extends BaseListState<Mortality> {}

// ==================== Animal Treatment Slice State ====================

export interface AnimalTreatmentState extends BaseListState<Treatment> {}

// ==================== Media Slice State ====================

export interface MediaState {
  list: Media[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  search: string
}

// ==================== Infinite Scroll State ====================

export interface InfiniteScrollState<T> extends BaseListState<T> {
  hasMore: boolean
}

// ==================== Species Infinite Scroll Slice State ====================

export interface SpeciesInfiniteScrollState extends InfiniteScrollState<Species> {}

// ==================== Animal Infinite Scroll Slice State ====================

export interface AnimalInfiniteScrollState extends InfiniteScrollState<Animal> {}

// ==================== Section Infinite Scroll Slice State ====================

export interface SectionInfiniteScrollState extends InfiniteScrollState<Section> {}

// ==================== Notes Slice State ====================

export interface NotesFilters {
  noteType: number | string | null
  priority: string | null
  createdBy: number | string | null
  taggedTo: number | string | null
}

export interface NotesState extends PaginationState, LoadingErrorState {
  list: Note[]
  filters: NotesFilters
  observationTypes: ObservationType[]
  observationTypesLoading: boolean
  observationMasterList: ObservationMasterItem[]
  observationMasterListLoading: boolean
  users: User[]
  usersLoading: boolean
}

// ==================== Combined Housing Module State ====================

export interface HousingModuleState {
  siteAnalytics: SiteAnalyticsState
  insights: InsightsState
  section: SectionState
  species: SpeciesState
  mortality: MortalityState
  animalTreatment: AnimalTreatmentState
  media: MediaState
  speciesInfiniteScroll: SpeciesInfiniteScrollState
  animalInfiniteScroll: AnimalInfiniteScrollState
  sectionInfiniteScroll: SectionInfiniteScrollState
  notes: NotesState
}

// ==================== Async Thunk Payloads ====================

export interface FetchSiteAnalyticsPayload {
  site_id: number
}

export interface FetchInsightsPayload {
  section_id: number
}

export interface FetchSectionsPayload {
  site_id?: number
  page_no?: number
  limit?: number
  q?: string
  sort_by?: string
  sort_order?: SortOrder
}

export interface FetchSpeciesPayload {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  page_no?: number
  limit?: number
  q?: string
  sort_by?: string
  sort_order?: SortOrder
}

export interface FetchMortalityPayload {
  site_id?: number
  section_id?: number
  page_no?: number
  limit?: number
  q?: string
  sort_by?: string
  sort_order?: SortOrder
}

export interface FetchAnimalTreatmentPayload {
  site_id?: number
  section_id?: number
  page_no?: number
  limit?: number
  q?: string
  sort_by?: string
  sort_order?: SortOrder
}

export interface FetchMediaPayload {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  page_no?: number
  limit?: number
  q?: string
}

export interface FetchNotesPayload {
  id: number | string
  type: 'site' | 'section' | 'enclosure' | 'animal'
  page_no?: number
  limit?: number
  note_type?: number | string
  priority?: string
  created_by?: number | string
  tagged_to?: number | string
}

export interface FetchInfiniteScrollPayload {
  site_id?: number
  section_id?: number
  enclosure_id?: number
  page_no?: number
  limit?: number
  q?: string
  sort_by?: string
  sort_order?: SortOrder
}

// ==================== Async Thunk Results ====================

export interface FetchListResult<T> {
  list: T[]
  total: number
}

export interface FetchNotesResult {
  list: Note[]
  total: number
}

// ==================== Action Payloads ====================

export interface SetParamsPayload {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: SortOrder
}

export interface SetPaginationPayload {
  page: number
  pageSize: number
}

export interface SetFiltersPayload {
  noteType?: number | string | null
  priority?: string | null
  createdBy?: number | string | null
  taggedTo?: number | string | null
}

export interface PaginationModel {
  page: number
  pageSize: number
}

// ==================== Filter State Types ====================

export interface SiteFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: SortOrder
}

export interface SectionFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: SortOrder
}

export interface SpeciesFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: SortOrder
}

export interface AnimalFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: SortOrder
}
