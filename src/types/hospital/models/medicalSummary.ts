/**
 * Medical-summary domain model types for the Hospital module.
 *
 * Extracted from `src/types/hospital/models.ts`. Used by the per-patient
 * medical-summary tab that lists complaints / assessments / prescriptions /
 * lab tests / attachments grouped by day.
 */

import type { Id, AnimalCategory } from '../models'

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface MedicalSummary {
  date: string
  created_at: string
  day: string
  entries: MedicalEntries[]
}

export interface MedicalEntries {
  time: string
  incon: string
  title: string
  ref_id: Id
  details: MedicalSummaryDetails[]
}

export interface MedicalSummaryDetails {
  type: AnimalCategory
  notes: string
  case_type: string
  diagnosis: string
  lab_tests: string
  complaints: string
  created_by: string
  assessments: string
  attachments: string
  created_for: string
  prescriptions: string
  follow_up_date: string | null
  medical_record_number: string
}
