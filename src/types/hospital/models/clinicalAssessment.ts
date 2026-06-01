/**
 * Clinical-assessment domain model types for the Hospital module.
 *
 * Extracted from the monolithic `src/types/hospital/models.ts`.
 * Shared primitives (`Id`, `SymptomStatus`, `Severity`, `DurationUnit`, `UserAvatarInfo`)
 * remain in the parent `models.ts` so both symptom and clinical models can reference them.
 */

import type {
  Id,
  Severity,
  DurationUnit,
  SymptomStatus,
  UserAvatarInfo
} from '../models'

export type ClinicalAsmntType = 'Diagnosis' | 'Tentative' | 'diagnosis' | 'tentative'

export type Prognosis =
  | 'Favourable'
  | 'Guarded'
  | 'Doubtful'
  | 'Poor'
  | 'Grave'
  | 'favourable'
  | 'guarded'
  | 'doubtful'
  | 'poor'
  | 'grave'

export type DiagnosisNoteType = 'comment' | 'note'

export type MedicalStatus = 'resolved' | 'active'

export interface DiagnosisNotes {
  note?: string
  type?: DiagnosisNoteType
  status?: SymptomStatus
  note_id?: Id
  note_date?: string | null
  note_time?: string | null
  created_at?: string
  notes_dump?: DiagnosisNotesDump
  modified_at?: string
  activity_updated_at?: string
  created_by_user_name?: string
  is_system_generated?: number
}

export interface DiagnosisNotesDump {
  new_data?: {
    status?: SymptomStatus
    prognosis?: Prognosis
    is_cronical?: number
    clinical_assessment?: ClinicalAsmntType
  }
  old_data?: {
    status?: SymptomStatus
    prognosis?: Prognosis
    is_cronical?: number
    clinical_assessment?: ClinicalAsmntType
  }
}

export interface ClinicalRecords {
  category?: string
  category_string_id?: string
  main_id?: Id
  medical_record_id?: Id
  medical_record_code?: Id
  name?: string
  recorded_date_time?: string
  clinical_assessment?: ClinicalAsmntType
  prognosis?: Prognosis
  string_id?: string
  created_by_user_name?: string
  created_at?: string
  status?: SymptomStatus
  chronic?: boolean
  active_at?: string
  closed_at?: null | string
  latest_active_date?: string | null
  latest_active_time?: string | null
  start_note?: string | null
  stop_note?: string | null
  closed_comment_date?: string | null
  diagnosis_notes: DiagnosisNotes[]
}

export interface ClinicalAssessmentCardList {
  id: Id
  category: string
  comment_count: string
  category_string_id?: string
  main_diagnosis_id: Id
  clinical_assessment: ClinicalAsmntType
  prognosis: Prognosis
  medical_record_id: Id
  created_by_user_name?: string
  updated_by_user_name?: string | null
  created_user_profile_pic?: string
  updated_user_profile_pic?: string | null
  created_at: string
  string_id?: string
  medical_record_code: Id
  additional_info?: ClinicalAssessmentAdditionalInfo
  name: string
  latest_note?: {
    notes_dump: DiagnosisNotesDump
    note: string
    status?: string
    created_at?: string
    modified_at?: string
    is_system_generated?: number | boolean
  }
}

export interface ClinicalAssessmentAdditionalInfo {
  recorded_date_time: string
  prognosis: Prognosis
  isChronic: number
  status: SymptomStatus
  note: string
  severity: Severity
  stop_note?: string | null
  start_note?: string | null
  latest_note?: string
  latest_comment?: string | null
  resolved_user_name?: string | null
  severity_string_id?: string
  clinical_assessment?: ClinicalAsmntType
  closed_comment_date?: string | null
  resolved_user_profile_pic?: string
  closed_at?: string | null
}

export interface UpdateClinicalAssmntCard {
  medical_record_id: Id
  type: ClinicalAsmntType
  duration_unit: DurationUnit | null
  zoo_id: Id
  is_system_generated: boolean
  hospital_case_id: Id
  recorded_date_time: string
  time_zone: string
  main_diagnosis_id: Id
  name: string
  string_id?: string
  additional_info: UpdateClinicalAssmntAdditionalInfo
}

export interface UpdateClinicalAssmntAdditionalInfo {
  active_at: string
  clinical_assessment: ClinicalAsmntType
  isChronic: boolean
  prognosis: Prognosis
  status: SymptomStatus
  notes: string
  name: string
  string_id?: string
}

export interface ClinicalAssessmentList {
  id: string
  name: string
  category_name: string
  is_contagious: string
  transmission_mode: string | null
}

export interface Diagnosis {
  diagnosis_id?: Id
  id?: Id
  name?: string
  description?: string
  diagnosed_at?: string
}

export interface ClinicalAssessment {
  assessment_id?: Id
  id?: Id
  patient_id?: Id
  assessment_type?: string
  data?: Record<string, unknown>
  assessed_by?: UserAvatarInfo
  assessed_at?: string
}

// Clinical-note models live in ./clinicalNotes — re-exported here for back-compat.
export type { ClinicalNote, ClinicalNotesList, ClinicalNotesParams } from './clinicalNotes'
