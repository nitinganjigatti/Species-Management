/**
 * Component props types for the Necropsy module
 */

import { ReactNode, SyntheticEvent } from 'react'
import { Theme } from '@mui/material/styles'
import { GridPaginationModel } from '@mui/x-data-grid'
import {
  NecropsyCenter,
  NecropsySummary,
  NecropsyOrgan,
  NecropsyTemplate,
  BodyPart,
  LabRequest,
  LabSample,
  LabTest,
  LabNote,
  LabReport,
  SampleLog,
  CarcassTransfer,
  TransferAnimal,
  TransferChecklist,
  IncomingNecropsySummary,
  IncomingNecropsyComment,
  IncomingNecropsyBtnStatus,
  MedicalRecord,
  MedicalBasicData,
  Diagnosis,
  Prescription,
  NecropsyTimelineItem,
  SelectOption,
  WeightUnitOption,
  User
} from './models'
import {
  ViewType,
  ActiveCard,
  DateFilter,
  AnimalFilters,
  SpeciesFilters
} from './state'

// ==================== Base Drawer Props ====================

export interface BaseDrawerProps {
  open: boolean
  onClose: () => void
}

export interface BaseDrawerWithIdProps extends BaseDrawerProps {
  id?: number | string | null
}

// ==================== Lab Request Drawer Props ====================

export interface LabRequestDetailsDrawerProps extends BaseDrawerProps {
  requestGuid?: string | null
  labCode?: string
}

export interface TestDetailsDrawerProps extends BaseDrawerProps {
  test: LabTest | null
  subTests: LabTest[]
  loading?: boolean
}

export interface SampleDetailsDrawerProps extends BaseDrawerProps {
  sample: LabSample | null
  logs: Record<string, SampleLog[]>
  logsLoading?: boolean
  activeTab?: number
  onTabChange?: (tab: number) => void
}

// ==================== Necropsy Drawer Props ====================

export interface IncomingNecropsyDrawerProps extends BaseDrawerProps {
  transferId?: number | null
  onAcceptSuccess?: () => void
  hideAcceptButton?: boolean
}

export interface TransferChecklistDrawerProps extends BaseDrawerProps {
  transferId?: number | null
  checklist?: TransferChecklist[]
  editable?: boolean
  onSave?: (checklist: TransferChecklist[]) => void
}

export interface NecropsyTimelineDrawerProps extends BaseDrawerProps {
  necropsyId?: number | null
  animalId?: number | null
  title?: string
}

export interface MedicalJournalDrawerProps extends BaseDrawerProps {
  animalId?: number | null
  title?: string
}

export interface MedicalRecordDetailDrawerProps extends BaseDrawerProps {
  medicalRecordId?: number | null
  animalId?: number | null
}

// ==================== Organ & Template Drawer Props ====================

export interface SelectOrganDrawerProps extends BaseDrawerProps {
  bodyParts: BodyPart[]
  selectedOrgans?: number[]
  onSelect: (organIds: number[]) => void
  loading?: boolean
}

export interface AddOrganDrawerProps extends BaseDrawerProps {
  bodyParts: BodyPart[]
  existingOrgans?: NecropsyOrgan[]
  onSave: (organs: NecropsyOrgan[]) => void
  loading?: boolean
}

export interface EditTemplateDrawerProps extends BaseDrawerProps {
  template?: NecropsyTemplate | null
  bodyParts: BodyPart[]
  onSave: (template: Partial<NecropsyTemplate>) => void
  loading?: boolean
}

export interface NecropsyOrganSectionProps {
  organs: NecropsyOrgan[]
  bodyParts: BodyPart[]
  onOrgansChange: (organs: NecropsyOrgan[]) => void
  editable?: boolean
  loading?: boolean
}

// ==================== Filter Drawer Props ====================

export interface NecropsyFilterDrawerProps extends BaseDrawerProps {
  filters: AnimalFilters
  onApply: (filters: AnimalFilters) => void
  onReset: () => void
}

export interface SpeciesFilterDrawerProps extends BaseDrawerProps {
  filters: SpeciesFilters
  onApply: (filters: SpeciesFilters) => void
  onReset: () => void
}

export interface SpeciesAnimalFilterDrawerProps extends BaseDrawerProps {
  tsn: string
  speciesName?: string
  necropsyCenterId?: number
  status?: string
}

export interface CarcassTransferFilterDrawerProps extends BaseDrawerProps {
  filters: {
    status?: string
    site_id?: number
    from_date?: string
    to_date?: string
  }
  onApply: (filters: Record<string, unknown>) => void
  onReset: () => void
}

// ==================== Necropsy Center Drawer Props ====================

export interface AddNecropsyCenterDrawerProps extends BaseDrawerProps {
  center?: NecropsyCenter | null
  onSave: (center: Partial<NecropsyCenter>) => void
  loading?: boolean
}

// ==================== Card & List Component Props ====================

export interface CarcassTransferCardProps {
  transfer: CarcassTransfer
  onClick?: (transfer: CarcassTransfer) => void
  onViewDetails?: (transfer: CarcassTransfer) => void
  onAccept?: (transfer: CarcassTransfer) => void
  showActions?: boolean
}

export interface TransferPassQRCardProps {
  open: boolean
  onClose: () => void
  transfer?: CarcassTransfer | null
  qrCodeUrl?: string
}

export interface NecropsyAnimalInfoCardProps {
  animal?: {
    animal_id?: number
    animal_code?: string
    local_id?: string
    species_name?: string
    scientific_name?: string
    default_common_name?: string
    default_icon?: string
    sex_type?: string
    age_class?: string
    site_name?: string
    section_name?: string
    enclosure_name?: string
  } | null
  showMortality?: boolean
  mortalityDate?: string
  onClick?: () => void
  loading?: boolean
}

// ==================== List Component Props ====================

export interface LabRequestsListProps {
  animalId?: number
  necropsyId?: number
  labRequests?: LabRequest[]
  loading?: boolean
  onRequestClick?: (request: LabRequest) => void
}

export interface MedicalRecordsListProps {
  animalId?: number
  records?: MedicalRecord[]
  loading?: boolean
  onRecordClick?: (record: MedicalRecord) => void
}

export interface DiagnosisListProps {
  diagnoses?: Diagnosis[]
  loading?: boolean
  editable?: boolean
  onDiagnosisClick?: (diagnosis: Diagnosis) => void
}

export interface PrescriptionListProps {
  prescriptions?: Prescription[]
  loading?: boolean
  editable?: boolean
  onPrescriptionClick?: (prescription: Prescription) => void
}

// ==================== Tab Component Props ====================

export interface AssessmentTabsProps {
  animalId?: number
  activeTab?: number
  onTabChange?: (event: SyntheticEvent, newValue: number) => void
}

export interface MedicalHistoryTabsProps {
  animalId?: number
  activeTab?: number
  onTabChange?: (event: SyntheticEvent, newValue: number) => void
}

// ==================== Form Component Props ====================

export interface UserMultiSelectProps {
  label?: string
  placeholder?: string
  selectedUsers: (number | string)[]
  onChange: (users: (number | string)[]) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
  size?: 'small' | 'medium'
  fullWidth?: boolean
  maxSelections?: number
}

export interface NecropsyDropdownProps {
  value: NecropsyCenter | null
  onChange: (center: NecropsyCenter | null) => void
  centers: NecropsyCenter[]
  loading?: boolean
  disabled?: boolean
  placeholder?: string
  error?: boolean
  helperText?: string
  size?: 'small' | 'medium'
  fullWidth?: boolean
  showAddButton?: boolean
  onAddClick?: () => void
}

// ==================== Navigation Component Props ====================

export interface NecropsyNavigationProps {
  activeCard: ActiveCard
  onCardChange: (card: ActiveCard) => void
  stats: {
    INCOMING: number
    PENDING: number
    DRAFT: number
    COMPLETED: number
    CARCASS_TRANSFER: number
  }
  loading?: boolean
}

// ==================== Page Component Props ====================

export interface MortalityReportSectionProps {
  necropsyCenterId?: number
  dateRange?: DateFilter
}

export interface NecropsySummaryContentProps {
  summary: NecropsySummary | null
  loading?: boolean
  onEdit?: () => void
  editable?: boolean
}

export interface NecropsyAnalyticsProps {
  necropsyCenterId?: number
  dateRange?: DateFilter
}

export interface NecropsyReportFormProps {
  necropsyId?: number | null
  animalId?: number | null
  mortalityId?: number | null
  initialData?: Partial<NecropsySummary>
  mode: 'create' | 'edit' | 'view'
  onSave?: (data: Partial<NecropsySummary>) => void
  onCancel?: () => void
}

export interface NecropsySpeciesListContentProps {
  necropsyCenterId?: number
  status?: string
  dateRange?: DateFilter
  searchQuery?: string
  filters?: SpeciesFilters
}

export interface NecropsyDetailContentProps {
  necropsyId?: number
  animalId?: number
  onBack?: () => void
}

// ==================== Utility Component Props ====================

export interface DateRangePickerProps {
  value: DateFilter
  onChange: (dateRange: DateFilter) => void
  disabled?: boolean
  maxDate?: Date
  minDate?: Date
}

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  disabled?: boolean
  debounceMs?: number
}

// ==================== Data Grid Props ====================

export interface NecropsyDataGridProps {
  rows: Record<string, unknown>[]
  loading: boolean
  paginationModel: GridPaginationModel
  onPaginationModelChange: (model: GridPaginationModel) => void
  totalRows: number
  onRowClick?: (row: Record<string, unknown>) => void
}
