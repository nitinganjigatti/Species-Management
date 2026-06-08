/**
 * Treatment monitoring (parameter / assessment / interval) domain model types
 * for the Hospital module.
 *
 * Extracted from the monolithic `src/types/hospital/models.ts`.
 *
 * Scope: types for the per-patient treatment monitoring tab — other treatments,
 * monitoring parameters, assessment intervals, vital/measurement units, and
 * hospital-level monitoring templates.
 *
 * Out of scope: the patient medical-summary block (Day / MedicalSummary /
 * MedicalEntries / MedicalSummaryDetails) and the master surgery/anesthesia
 * domains, which all stay in their own files.
 */

import type { Id, UserAvatarInfo } from '../models'

// ==================== Other treatments ====================

export interface TreatmentMonitoringEntry {
  entry_id?: Id
  id?: Id
  patient_id?: Id
  parameter_id?: Id
  parameter_name?: string
  value?: string | number
  unit?: string
  recorded_at?: string
  recorded_by?: UserAvatarInfo
}

export interface OtherTreatment {
  id: string
  animal_id: string
  treatment_master_id: string
  hospital_case_id: string
  medical_record_id: string
  medical_record_code: string
  treatment_name: string
  treatment_start_date_time: string
  note: string
  is_first: string | number
  created_at: string
  update_at: string
  created_by_name: string
  profile_pic: string
  notes_count: string | number
  is_modified: string | number
}

export interface OtherTreatmentRecord {
  medical_record_id: string
  medical_record_code: string
  treatments: OtherTreatment[]
}

export interface TreatmentMaster {
  id: string
  treatment_name: string
}

// ==================== Parameter / interval state ====================

export type RemoveParameterPeriod = 'only_today' | 'from_today_onwards'

export interface TreatmentMonitoringData {
  assessment_type_id: string
  label: string
  frequency_label: string
  duration_minutes: string | null
  assessment_details: AssessmentDetails[]
}

export interface AssessmentDetails {
  assessment_value: string
  assessment_unit_id: string
  record_time: string
  assessment_type_id: string
  total_records: string
  unit_name: string
  record_time_utc: string
  record_time_ist: string
  recorded_date_time_ist: string
  recorded_date_time_utc: string
  hour_block: string
}

export interface PreviousAssessmentEntry {
  id: string
  animal_id: string
  medical_record_id: string
  assessment_type_id: string
  assessment_unit_id: string
  assessment_value: string
  assessment_rank: string
  base_uom_value: string
  base_uom_name: string
  created_at: string
  created_by: string
  modified_by: string | null
  record_date: string
  record_time: string
  comments: string
  hospital_case_id: string
  is_deleted: string
  recorded_date_time: string
  modified_at: string
  given_unit_name: string
  uom_abbr: string
  created_user_id: string
  user_first_name: string
  user_last_name: string
  user_email: string
  list_label: string | null
  user_full_profile_url: string
  modified_user_id: string | null
  modified_user_first_name: string | null
  modified_user_last_name: string | null
  modified_user_email: string | null
  modified_user_profile_full_pic: string | null
  modified_user_profile_full_url: string | null
  user_profile_full_url: string
}

export interface ParametersUnit {
  id: number
  uom_abbr: string
  string_id?: string
  unit_name: string
  base_uom_id: number
  base_uom_name: string
  measurement_type: string
}

export interface ParameterDropdownValue {
  id: string | number
  label: string
}

export interface MeasurementUnitDropdown {
  id: string | number
  uom_abbr: string
  unit_name: string
}

export interface MonitoringParameters {
  hospital_case_id: string
  assessment_type_id: string
  assessment_interval: string
  label: string
  frequency_label: string
}

export interface AddIntervalParameter {
  parameter_id: string
  parameter_value: string
}

export interface IntervalAssessmentList {
  id: string
  frequency_label: string
  duration_minutes: string | null
  sort_order: string
  is_deleted: string
  created_by: string | null
  created_at: string
  updated_at: string | null
  updated_by: string | null
}

// ==================== Templates (assessment) ====================

export interface TemplatesAssessmentList {
  assessment_template_id: string
  template_name: string
  description: string
  zoo_id: string
  active: string
  reason_to_delete: string | null
  created_by: string
  updated_by: string | null
  created_on: string
  updated_on: string
  assigned_assessment_types: string
  assigned_species_count: string
}

export interface TemplateAssessmentTypes {
  assessment_type_id: string
  description: string
  assessments_type_label: string
  string_id?: string
  category_string_id?: string
  response_type: string
  measurement_type: string
  assessment_category_id: string
  active: string
  created_by: string
  updated_by: string | null
  created_on: string
  updated_on: string
  label: string
  template_count: string
  default_values: TemplateAssessmentDefaultValues[]
  already_in_use: boolean
}

export interface TemplateAssessmentDefaultValues {
  id: Id
  desc: string
  label: string
  order: number
  active: number
  string_id?: string
  created_by: number
  created_on: string
  updated_by: number | null
  updated_on: string | null
}

export interface SaveTemplate {
  status: boolean
  id: number
  template_name: string
  description: string
  ref_type: string
  zoo_id: string
  hospital_id: string
}

// ==================== Hospital-level parameter filters ====================

export interface HospitalParametersUnit {
  assessment_type_id: string
  description: string
  measurement_type: string
  string_id?: string
  response_type: string
  assessment_category_id: string
  dropdown_values: ParameterDropdownValue[]
  measurement_units_dropdown: MeasurementUnitDropdown[]
}

export interface ParametersBasedOnFilters {
  assessment_type_id: Id
  description: string
  assessments_type_label: string
  string_id?: string
  category_string_id?: string
  response_type: string
  measurement_type: string
  assessment_category_id: Id
  active: string | number
  created_by: string | number
  updated_by: string | number | null
  created_on: string
  updated_on: string | null
  label: string
  template_count: string | number
  default_values: TemplateAssessmentDefaultValues
  already_in_use: true
}

export interface HospitalParamsFilterOption {
  assessment_category_id: string
  label: string
  string_id: string
  active: string
  created_by: string
  updated_by: string
  created_on: string
  updated_on: string
  zoo_id: string
  assessment_type_count: string
}
