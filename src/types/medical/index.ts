/**
 * Medical Records Module Types
 *
 * This module exports all TypeScript types for the medical records module.
 * Import types from 'src/types/medical' for use throughout the application.
 */

// ==================== Model Types ====================
export type {
  AnimalData,
  MedicalRow,
  FilterOptions,
  SortType,
  FilterDate,
  PaginationFilters
} from './models'

// ==================== API Types ====================
export type {
  ApiResponse,
  MedicalRecordsParams,
  MedicalReportParams,
  MedicalRecordsResponse,
  MedicalReportResponse
} from './api'

// ==================== Component Props Types ====================
export type {
  MedicalAnimalDrawerProps,
  MedicalFilterDrawerProps,
  MedicalSortBottomSheetProps,
  MedicalRecordsState
} from './components'
