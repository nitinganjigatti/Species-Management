/**
 * Patient-media domain model types for the Hospital module.
 *
 * Extracted from `src/types/hospital/models.ts`. Covers the media/attachments
 * tab on the patient detail page — file metadata, upload payloads, and notes.
 */

import type { Id, UserAvatarInfo } from '../models'

export interface Files {
  id: Id
  file: string
  url: string
  file_original_name?: string
  file_type: string
  created_at?: string
  modified_at?: string
  user_profile: UserProfile
}

export interface UserProfile {
  user_id?: Id
  user_first_name?: string
  user_last_name?: string
  user_full_name?: string
  user_mobile?: string
  user_email?: string
  user_profile_pic?: string
}

export interface HospitalVisitSummary {
  download_url?: string
  download_file_url?: string
}

export interface PatientMedia {
  media_id?: Id
  id?: Id
  patient_id?: Id
  url?: string
  type?: string
  uploaded_at?: string
  uploaded_by?: UserAvatarInfo
}

export interface PatientMediaData {
  id: Id
  file: string
  thumbnail: null
  file_original_name: string
  created_at: string
  user_profile_pic: string
  user_name: string
  created_by: Id
  is_created_for_medical_record: number | string
  is_for_current_medical_record: number | string
  download_url: string
}

export interface UploadPatientMediaData {
  id: Id
  file: string
  url: string
  file_original_name: string
  file_type: string
  notes_type: string
  created_at: string
  modified_at: string
  user_profile: UserProfile
}

export interface PatientMediaNotes {
  id: Id
  medical_record_id: Id
  hospital_case_id: Id | null
  medicine_id: Id | null
  animal_id: Id
  note: string
  file_original_name: string | null
  notes_type: string
  is_deleted: number | string
  created_for: string
  created_by: Id
  modified_by: Id | null
  created_at: string
  modified_at: string
  name: string
  date: string
}
