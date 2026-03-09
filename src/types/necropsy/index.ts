/**
 * Necropsy Module Types
 *
 * This module exports all TypeScript types for the necropsy module.
 * Import types from 'src/types/necropsy' for use throughout the application.
 */

// ==================== Model Types ====================
export type {
  // Necropsy Center
  NecropsyCenter,

  // Stats
  NecropsyStats,
  ActiveCard,

  // Animal Related
  AnimalNecropsyItem,
  IndexedAnimalRow,

  // Species Related
  SpeciesNecropsyItem,
  IndexedSpeciesRow,

  // Mortality & Summary
  MortalitySummary,
  NecropsySummary,
  NecropsyAttachment,

  // Carcass Transfer
  CarcassTransfer,
  TransferAnimal,
  TransferChecklist,
  TransferChecklistItem,
  FilledChecklistItem,

  // Incoming Necropsy
  IncomingNecropsySummary,
  IncomingNecropsyComment,
  IncomingNecropsyBtnStatus,

  // Lab Related
  LabRequest,
  LabSample,
  LabTest,
  LabSubTest,
  SampleLog,
  LabNote,
  LabReport,

  // Template & Organs
  NecropsyTemplate,
  BodyPart,
  BodyPartOrgan,
  NecropsyOrgan,

  // Timeline
  NecropsyTimelineItem,

  // Medical History
  MedicalRecord,
  MedicalBasicData,
  MedicalBasicDataItem,
  ClinicalAssessment,
  AssessmentType,
  AssessmentData,
  MedicalJournalLog,

  // Diagnosis & Prescription
  Diagnosis,
  Prescription,

  // Form Options
  SelectOption,
  WeightUnitOption,
  MeasurementUnit,

  // User
  User,
  UserAvatarInfo
} from './models'

// ==================== API Types ====================
export type {
  // Generic
  ApiResponse,
  PaginatedData,
  PaginatedResponse,
  ApiError,

  // Necropsy Center
  NecropsyListingParams,
  NecropsyListingResponse,
  AddUpdateNecropsyCenterPayload,

  // Stats
  NecropsyStatsParams,
  NecropsyStatsApiResponse,
  NecropsyStatsResponse,

  // Animal/Species Lists
  AnimalWiseListParams,
  AnimalWiseListResponse,
  SpeciesWiseListParams,
  SpeciesWiseListResponse,

  // Incoming Transfer
  IncomingNecropsyTransferSummaryParams,
  IncomingNecropsyTransferSummaryResponse,
  IncomingNecropsyChecklistDetailsParams,
  IncomingNecropsyChecklistDetailsResponse,
  CreateIncomingNecropsyCommentPayload,
  IncomingNecropsyBtnStatusResponse,
  AcceptNecropsyTransferPayload,

  // Transfer Animal
  TransferAnimalListParams,
  TransferAnimalListResponse,

  // Checklist
  TransferChecklistResponse,
  FilledChecklistListResponse,

  // Necropsy Summary
  NecropsySummaryResponse,

  // Add/Edit Necropsy
  AddNecropsyPayload,
  NecropsyOrganPayload,
  EditNecropsyPayload,
  DeleteNecropsyPayload,

  // Body Parts
  NecropsyBodyPartsPayload,
  NecropsyBodyPartsResponse,

  // Template
  NecropsyTemplateResponse,
  CreateNecropsyTemplatePayload,
  UpdateNecropsyTemplatePayload,

  // Timeline
  NecropsyTimelineParams,
  NecropsyTimelineResponse,

  // Mortality
  MortalitySummaryParams,
  MortalitySummaryResponse,

  // Medical Stats
  MedicalStatsParams,
  MedicalStatsResponse,

  // PDF
  NecropsyPdfParams,
  NecropsyPdfResponse,

  // Attachments
  DeleteAttachmentPayload,

  // Form Options
  MannerOfDeathResponse,
  CarcassDispositionResponse,
  MeasurementUnitsResponse,

  // Carcass Transfer
  CarcassTransferListParams,
  CarcassTransferListResponse,

  // Medical History
  MedicalRecordStatsParams,
  MedicalRecordStatsResponse,
  MedicalBasicDataListParams,
  MedicalBasicDataListResponse,
  MedicalCommonDataParams,
  MedicalCommonDataResponse,
  LabRequestsByAnimalParams,
  LabRequestsByAnimalResponse,
  AssessmentTypesResponse,
  AssessmentDataParams,
  AssessmentDataResponse,
  MedicalRecordDetailsResponse,
  MedicalJournalLogsParams,
  MedicalJournalLogsResponse,

  // Lab Details
  LabRequestDetailsResponse,
  LabRequestSamplesResponse,
  LabRequestNotesResponse,
  LabRequestReportsResponse,
  LabSubTestsResponse,
  LabSampleLogsResponse
} from './api'

// ==================== State Types ====================
export type {
  ViewType,
  NecropsyFilters,
  DateFilter,
  AnimalFilters,
  SpeciesFilters,
  NecropsyState,
  FormOptionsState,
  NecropsyModuleState,
  FetchCentersPayload,
  FetchNecropsyDataPayload,
  FetchListResult,
  FetchStatsResult,
  FetchFormOptionsResult,
  SetFiltersPayload,
  PaginationModel
} from './state'

// Re-export ActiveCard from state (different from models)
export type { ActiveCard as ActiveCardState } from './state'

// ==================== Hook Types ====================
export type {
  UseNecropsCenterParams,
  UseNecropsCenterReturn,
  UseNecropsyFormOptionsParams,
  UseNecropsyFormOptionsReturn,
  UseNecropsyListReturn,
  UseNecropsyCenter,
  UseNecropsyFormOptions,
  UseNecropsyList
} from './hooks'

// ==================== Component Props Types ====================
export type {
  // Base
  BaseDrawerProps,
  BaseDrawerWithIdProps,

  // Lab Drawers
  LabRequestDetailsDrawerProps,
  TestDetailsDrawerProps,
  SampleDetailsDrawerProps,

  // Necropsy Drawers
  IncomingNecropsyDrawerProps,
  TransferChecklistDrawerProps,
  NecropsyTimelineDrawerProps,
  MedicalJournalDrawerProps,
  MedicalRecordDetailDrawerProps,

  // Organ & Template Drawers
  SelectOrganDrawerProps,
  AddOrganDrawerProps,
  EditTemplateDrawerProps,
  NecropsyOrganSectionProps,

  // Filter Drawers
  NecropsyFilterDrawerProps,
  SpeciesFilterDrawerProps,
  SpeciesAnimalFilterDrawerProps,
  CarcassTransferFilterDrawerProps,

  // Center Drawer
  AddNecropsyCenterDrawerProps,

  // Cards
  CarcassTransferCardProps,
  TransferPassQRCardProps,
  NecropsyAnimalInfoCardProps,

  // Lists
  LabRequestsListProps,
  MedicalRecordsListProps,
  DiagnosisListProps,
  PrescriptionListProps,

  // Tabs
  AssessmentTabsProps,
  MedicalHistoryTabsProps,

  // Forms
  UserMultiSelectProps,
  NecropsyDropdownProps,

  // Navigation
  NecropsyNavigationProps,

  // Pages
  MortalityReportSectionProps,
  NecropsySummaryContentProps,
  NecropsyAnalyticsProps,
  NecropsyReportFormProps,
  NecropsySpeciesListContentProps,
  NecropsyDetailContentProps,

  // Utilities
  DateRangePickerProps,
  SearchInputProps,
  NecropsyDataGridProps
} from './components'
