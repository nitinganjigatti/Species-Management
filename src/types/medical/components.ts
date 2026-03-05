/**
 * Component props types for the Medical Records module
 */

import { AnimalData, MedicalRow, FilterOptions, SortType, FilterDate, PaginationFilters } from './models'

// ==================== Animal Drawer Props ====================

export interface MedicalAnimalDrawerProps {
  open: boolean
  onClose: () => void
  handleAnimalClick: (animal: any) => void
  btnText?: string
  module?: string
  showFilterAndSort?: boolean
  handleFilterClick?: () => void
  handleSortClick?: () => void
  filters?: FilterOptions
  sortType?: SortType
  filterCount?: number
}

// ==================== Filter Drawer Props ====================

export interface MedicalFilterDrawerProps {
  openFilterDrawer: boolean
  onCloseFilterDrawer: () => void
  onSubmitLoading: boolean
  onApplyFilters: (selectedOptions: FilterOptions) => void
  setFilterCount: (count: number) => void
  filterCount: number
  initialSelectedOptions: FilterOptions
}

// ==================== Sort Bottom Sheet Props ====================

export interface MedicalSortBottomSheetProps {
  open: boolean
  onClose: () => void
  onApply: (sort: SortType) => void
  currentSort: SortType
}

// ==================== Medical Records Page Props ====================

export interface MedicalRecordsState {
  animalDrawer: boolean
  selectedAnimal: AnimalData | null
  animalLoader: boolean
  rows: MedicalRow[]
  total: number
  loading: boolean
  searchValue: string
  isDownloading: boolean
  downloadingRowId: string | number | null
  filterDate: FilterDate
  openFilterDrawer: boolean
  filterCount: number
  isSortBottomSheetOpen: boolean
  currentSort: SortType
  selectedOptions: FilterOptions
  filters: PaginationFilters
}
