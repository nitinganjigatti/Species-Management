/**
 * Clinical-note domain model types for the Hospital module.
 *
 * Extracted from `models/clinicalAssessment.ts`. Clinical notes are their own
 * tab in the patient detail page (separate from clinical assessments / diagnoses),
 * so they live in their own file for clarity.
 */

import type { Id, UserAvatarInfo } from '../models'

export interface ClinicalNote {
  note_id?: Id
  id?: Id
  patient_id?: Id
  note?: string
  created_by?: UserAvatarInfo
  created_at?: string
}

export interface ClinicalNotesList {
  note_id: string
  note: string
  created_by_id: Id
  medical_record_code: string
  created_by_user_name: string
  user_created_profile_pic: string
  created_at: string
}

export interface ClinicalNotesParams {
  type: string
  limit: number
  hospital_case_id: Id
  medical_type: string
  page: string | number
}
