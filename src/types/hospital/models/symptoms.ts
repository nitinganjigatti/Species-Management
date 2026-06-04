/**
 * Symptom-related domain model types for the Hospital module.
 *
 * Extracted from the monolithic `src/types/hospital/models.ts`.
 * Shared primitives (`Id`, `Severity`, `DurationUnit`, `SymptomStatus`, `MedicalType`,
 * `ClinicalAsmntType`, `DiagnosisNoteType`, `MedicalStatus`) remain in the parent
 * `models.ts` so that both symptom and clinical-assessment models can reference them.
 */

import type {
  Id,
  Severity,
  DurationUnit,
  SymptomStatus,
  MedicalType,
} from '../models'
import { ClinicalAsmntType } from './clinicalAssessment'

export interface Symptom {
  symptom_id?: Id
  id?: Id
  name?: string
  description?: string
  severity?: string
  observed_at?: string
}

export interface SymptomList {
  comment_count?: number | string
  complaint_id?: Id
  medical_record_id?: Id
  medical_record_code?: Id
  name: string
  status: SymptomStatus
  created_by_user_name: string
  created_user_profile_pic: string
  created_at: string
  type?: ClinicalAsmntType
  additional_info: {
    severity: Severity
    recorded_date_time: string
    duration: number | string
    duration_unit: DurationUnit
    resolved_user_profile_pic: string | null
    resolved_user_name: string | null
    closed_comment_date: string | null
  }
  latest_note: {
    notes_dump: NotesDump
    note: string
    status?: string
    created_at?: string
    modified_at?: string
  }
}

export interface SymptomsListForAdding {
  id: Id
  name: string
  category_name?: string
  symptomId?: Id
  severity?: Severity
}

export interface SymptomRecords {
  category?: string
  category_string_id?: string
  complaint_id?: Id
  main_id?: Id
  medical_record_id: Id
  recorded_date_time?: string
  medical_record_code?: string
  name?: string
  string_id?: string
  created_by_user_name?: string
  created_at?: string
  status?: SymptomStatus
  severity?: Severity
  severity_string_id?: string
  duration?: string
  duration_unit?: DurationUnit
  active_at?: string
  complaint_notes?: ComplaintNotes[]
}

export interface ComplaintNotes {
  note: string
  created_at: string
  notes_dump: NotesDump
  modified_at?: string | null
  duration_unit: DurationUnit
  created_by_user_name: string
  is_system_generated: number
}

export interface NotesDump {
  new_data?: {
    status?: SymptomStatus
    severity?: Severity
    durationUnit?: DurationUnit
  }
  old_data?: {
    status?: SymptomStatus
    severity?: Severity
    durationUnit?: DurationUnit
  }
}

export interface SymptomsClinicalAdditionalInfo {
  notes?: string
  status?: SymptomStatus
  duration?: string
  severity?: Severity
  active_at?: string
  stop_note?: string
  duration_unit?: DurationUnit
  severity_string_id?: string
  duration_unit_string_id?: string
  comment_list?: string[]
}

export interface ComplaintsAdditionalInfo {
  severity: Severity
  notes: string
  active_at: string
  duration: string
  duration_unit: DurationUnit
  status: SymptomStatus
  comment_list: string[] | []
  recorded_date_time: string
}

export interface Complaints {
  id?: Id
  name?: string
  additional_info?: ComplaintsAdditionalInfo[]
}

export interface AddSymptomsCard {
  id?: Id
  medical_record_id?: Id
  name?: string
  string_id?: string
  medical_complaint_id?: Id
  additionalInfo?: SymptomsClinicalAdditionalInfo
  latest_note?: string[]
}

export interface UpdateSymptomsCard {
  medical_record_id: Id
  type?: MedicalType
  hospital_case_id?: Id
  recorded_date_time?: string
  time_zone?: string
  main_complaint_id?: Id
  name?: string
  string_id?: string
  duration_unit?: DurationUnit
  additional_info?: UpdateAdditionalInfoSymptomsCard
}

export interface UpdateAdditionalInfoSymptomsCard {
  id?: Id
  active_at?: string
  severity?: Severity
  duration?: string
  duration_unit?: DurationUnit
  status?: SymptomStatus
  notes?: string
  name?: string
  string_id?: string
  duration_unit_string_id?: string
  severity_string_id?: string
}

export interface GetSymptomClinicalTabList {
  id: Id
  category: string
  child_count: string
}

export interface CheckAnimalStatusByType {
  complaints: MedicalType
  id: Id
  diagnosis?: string
  animal_details?: {
    animal_id: Id
    site_name: string
    common_name: string
    default_icon: string
    section_name: string
    scientific_name: string
    user_enclosure_name: string
    local_identifier_name: string
    local_identifier_value: string
  }
  message: string
}
