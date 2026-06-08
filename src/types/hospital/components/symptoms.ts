import type React from 'react'

import type {
  Id,
  Severity,
  DurationUnit,
  SymptomStatus
} from 'src/types/hospital/models'
import type {
  SymptomsListForAdding,
  SymptomList,
  SymptomRecords,
  GetSymptomClinicalTabList,
  ComplaintsAdditionalInfo
} from 'src/types/hospital/models/symptoms'
import type { BaseDrawerProps } from 'src/types/hospital/components'
import type { GetSymptomRecordResponse } from 'src/types/hospital/api/Inpatient/symptoms'
import type { StatusKey, ActivityFormData } from 'src/types/hospital/components/common'

// ============================================================
// UI-only unions / route params
// ============================================================

export type SymptomParams = {
  id: string
  medical_record_id: string
}

// ============================================================
// Form data / local UI shapes
// ============================================================

export interface SymptomFormItem {
  id: Id
  name: string
  severity?: Severity
  notes?: string
  durationValue?: number
  durationUnit?: DurationUnit
  recordedDateTime?: string
}

export interface AddSymptomFormData {
  id: Id
  name: string
  additional_info: ComplaintsAdditionalInfo
}

export interface SymptomFormData {
  severity?: Severity
  durationValue?: number | string
  durationUnit?: DurationUnit
  notes?: string
  recordedDateTime?: string
}

export interface UpdateSymptomsCardFormData {
  complaint_id?: Id
  medical_record_id?: Id
  animal_id?: Id
  durationValue: number | string
  durationUnit: DurationUnit
  notes: string
  recordedDateTime: string
  severity: Severity
  status: SymptomStatus
}

export interface PreviousDetails {
  severity: Severity
  durationValue: number | string
  durationUnit: DurationUnit
  recordedDateTime: string
  status: SymptomStatus
}

// ============================================================
// Component prop interfaces
// ============================================================

export interface SelectedSymptomsProps {
  selected?: SymptomsListForAdding[]
  onRemove?: (id: Id) => void
  severity?: Severity
  alreadySelectedIds?: Id[]
  footer?: any
}

export interface SymptomsListProps {
  symptoms?: SymptomsListForAdding[]
  temporarilySelected?: SymptomsListForAdding | null
  selectedSymptoms?: Id[]
  onSelect?: (s: SymptomsListForAdding) => void
  searchQuery?: string
  handleSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleClearSearch?: () => void
  handleScroll?: (e: any) => void
  loading?: boolean
  searching?: boolean
  isTabsLoading?: boolean
  tabOptions?: GetSymptomClinicalTabList[]
  currentTab?: StatusKey | string
  handleTabChange?: (category: string, id: Id) => void
  symptomsCount?: number
  hasMore?: boolean
  handleAddNewClick?: () => void
  alreadySelectedIds?: Id[]
}

export interface SymptomsProps {
  selectedTab?: string
  patientData?: any
  overviewData?: any
  category?: string
}


export interface SymptomsCardProps {
  record: SymptomList
  isResolved?: boolean
  fetchSymptoms: (query?: string, page?: number, append?: boolean) => Promise<void> | void
  setPage: any
  patientData?: {
    animal_detail?: { animal_id?: Id }
    medical_record_code?: string
    admitted_at?: string
    discharge_at?: string
    status?: string
  }
  isDischared?: boolean
}

export interface ActivityListProps {
  activities?: ActivityFormData[]
  onEdit?: (activity: ActivityFormData) => void
  activityLoader?: boolean
  isFromAssessment?: boolean
}

export interface SelectedSymptomsProps {
  selected?: SymptomsListForAdding[]
  onRemove?: (id: Id) => void
  severity?: Severity
  alreadySelectedIds?: Id[]
  footer?: any
}

export interface SymptomsCardProps {
  record: SymptomList
  isResolved?: boolean
  fetchSymptoms: (query?: string, page?: number, append?: boolean) => Promise<void> | void
  setPage: any
  patientData?: {
    animal_detail?: { animal_id?: Id }
    medical_record_code?: string
    admitted_at?: string
    discharge_at?: string
    status?: string
  }
  isDischared?: boolean
}

export interface UpdateSymptomsCardFormData {
  complaint_id?: Id
  medical_record_id?: Id
  animal_id?: Id
  durationValue: number | string
  durationUnit: DurationUnit
  notes: string
  recordedDateTime: string
  severity: Severity
  status: SymptomStatus
}


// ============================================================
// Drawer prop interfaces
// ============================================================

export interface AddSymptomDrawerProps extends BaseDrawerProps {
  selectedSymptom?: SymptomsListForAdding | null
  onSave: (payload: SymptomFormData) => void
  severity: Severity
  setSeverity: (v: Severity) => void
  durationValue: number | string
  setDurationValue: (v: number | string) => void
  durationUnit: DurationUnit
  setDurationUnit: (v: DurationUnit) => void
  notes: string
  setNotes: (v: string) => void
  admittedDate?: string | null
  dischargedDate?: string | null
  isDischarged?: boolean
}

export interface AddEditSymptomDrawerProps extends BaseDrawerProps {
  selectedSymptom?: SymptomList | null
  onSave: (payload: UpdateSymptomsCardFormData) => void
  severity: Severity
  setSeverity: (v: Severity) => void
  durationValue: any
  setDurationValue: (v: string) => void
  durationUnit: DurationUnit
  setDurationUnit: (v: DurationUnit) => void
  notes: string
  setNotes: (v: string) => void
  setNoteId: (v: Id) => void
  noteId: Id
  status: SymptomStatus
  setStatus: (v: SymptomStatus) => void
  activityListData: SymptomRecords | null
  activityLoader?: boolean
  temporarilySelected: SymptomList | null
  setSymptomNoteModal: (v: boolean) => void
  symptomNoteModal: boolean
  fetchNotesForSymptom: (s: SymptomList | null) => Promise<GetSymptomRecordResponse>
  setIsUpdating: (v: boolean) => void
  isUpdating: boolean
  setIsDeleting: (v: boolean) => void
  isDeleting: boolean
  isSubmitLoading?: boolean
  setActivityListData: (v: SymptomRecords | null) => void
  isChanged?: boolean
  isResolved?: boolean
  admittedDate?: any
  dischargedDate?: any
  isDischarged?: boolean
}

