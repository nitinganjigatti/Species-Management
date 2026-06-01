/**
 * Inpatient surgery (record / flow) domain model types for the Hospital module.
 *
 * Extracted from the monolithic `src/types/hospital/models.ts`.
 *
 * Scope: types representing an actual surgery performed on a patient
 * (record, detail, attachments). NOT the surgery master (catalog) type
 * `SurgeryModel` — that remains in `models.ts` because it describes the
 * admin-side catalog of available surgeries. `SurgeryMaster` now lives
 * in `./surgeryMaster`.
 */

import type { Id, UserAvatarInfo } from '../models'
import type { AnesthesiaDetails } from './anesthesia'

export interface SurgeryRecord {
  surgery_id?: Id
  id?: Id
  patient_id?: Id
  template_id?: Id
  surgery_name?: string
  performed_at?: string
  performed_by?: UserAvatarInfo
  notes?: string
}

export interface SurgeryRecords {
  code: string
  id: Id
  detail: SurgeryDetails
}

export interface SurgeryDetails {
  id: Id
  code: string
  hospital_id: Id
  hospital_case_id: Id
  surgery_date: string
  start_time: string
  end_time: string
  type_of_surgery: string
  surgical_approach: string
  surgery_notes: string
  complications: string
  care_diet_instructions: string
  care_activity_restrictions: string
  additional_notes: string
  anaesthesia_id: Id
  surgery_id: Id
  surgery_name: string
  name_of_surgeon: string
  name_of_surgeon_id: Id
  updated_at: string | null
  updated_by_name: string | null
  attachments: SurgeryAttachments[]
  secondary_surgeons: string[]
  anaesthesia_detail: AnesthesiaDetails
}

export interface SurgeryAttachments {
  id: Id
  file: string
  file_type: string
  created_at: string
  modified_at: string | null
  user_full_name: string
  user_profile_pic: string | null
  file_original_name: string
}
