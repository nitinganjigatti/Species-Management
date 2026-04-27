/**
 * Domain model types for the Hospital module.
 *
 * Add concrete shapes here as APIs/components are converted.
 * Keep optional fields liberally — backend payloads vary across endpoints.
 */

import { HospitalTransferRow } from "../housing/hospitalTransfer"
import { Dayjs } from "dayjs"
// ==================== Generic Helpers ====================

export type Id = string | number
export type StatusAction = 'active' | 'inactive'
export interface UserAvatarInfo {
  user_id?: Id
  first_name?: string
  last_name?: string
  profile_pic?: string
  name?: string
  default_icon?: string
  id?: Id
  role_name?: string
}

export type DateRangeValue = Dayjs | null

export type FilterDate = {
  startDate?: DateRangeValue
  endDate?: DateRangeValue
  s?: DateRangeValue
  e?: DateRangeValue
}

// ==================== Hospital ====================

export interface Hospital {
  hospital_id?: Id
  id?: Id
  name?: string
  hospital_name?: string
  address?: string
  city?: string
  state?: string
  country?: string
  total_beds?: number
  available_beds?: number
  occupied_beds?: number
  total_rooms?: number
  is_active?: number | boolean
  created_at?: string
  updated_at?: string
}

export interface HospitalRoom {
  room_id?: Id
  id?: Id
  hospital_id?: Id
  name?: string
  room_name?: string
  room_type?: string
  total_beds?: number
  occupied_beds?: number
  available_beds?: number
  is_active?: number | boolean
}

export interface HospitalBed extends HospitalRoom {
  bed_id?: Id
  bed_no?: string | number
  bed_name?: string
  status?: string
  is_occupied?: number | boolean
  patient_id?: Id
}

export interface HospitalAnalytics {
  total_admissions?: number
  total_discharges?: number
  total_inpatients?: number
  total_outpatients?: number
  total_mortality?: number
  occupancy_rate?: number
  [key: string]: unknown
}
export interface SurgeryModel {
  id: Id
  zoo_id: Id
  surgery_id: Id
  master_surgery_id: Id
  surgeryId: Id
  name?: string
  surgery_name?: string
  description?: string
  status?: StatusAction
  created_by?: string
  created_at?: string
  updated_by?: string | null
  updated_at?: string | null
}

// ==================== Hospital Master ====================
export interface HospitalLists {
  id: Id
  hospital_name?: string
  total_rooms?: string
  total_occupants?: string
  active?: string
  site_name?: string
  created_by_name?: string
  profile_image?: string | null
  updated_by_name?: string
  updated_user_profile_image?: string | null
  created_at?: string
  updated_at?: string
}

export interface SiteLists {
  site_id?: string | number | null
  site_name?: string
}

export interface HospitalDetail {
  hospital_id: Id
  site_id: string | number | null
  description?: string
  status?: string
  is_active?: string
  hospital_name?: string
  site_name?: string
  no_of_rooms?: string
  no_of_occupied?: string
  active_room_count?: string
  active_bed_count?: string
  created_by_name?: string
  updated_by_name?: string
  profile_pic?: string | null
  updated_user_profile_pic?: string | null
  created_at?: string
  updated_at?: string
  updated_by?: string | null
  created_by?: string
}

export interface UpdateRoom {
  id: Id
  entity_code?: string
  name?: string
  description?: string
  zoo_id: Id
  site_id: string | number | null
  is_active?: number
  created_by?: Id
  updated_by?: Id | null
  deleted_by?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  entity_type?: string
}

export interface RoomRecord {
  id: string
  hospital_id: string
  room_name?: string
  floor_name?: string
  no_of_bed?: string
  no_of_occupied?: string
  status?: string | number
  active_bed_count?: string
  inactive_bed_count?: string
  availability?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string | null
  created_by_name?: string
  updated_by_name?: string | null
  profile_pic?: string
}
export interface BedRecord {
  id: Id
  hospital_id: string
  animal_id: string
  bed_name?: string
  bed_code?: string
  active?: string
  is_occupied?: string
  default_common_name?: string
  scientific_name?: string
  occupant_icon?: string | null
  age?: string
  sex?: string
  site_name?: string
  enclosure_name?: string
  section_name?: string
  animal_count?: string
  admitted_at?: string
  created_at?: string
  created_by?: string
  created_by_name?: string
  latest_weight?: string
  weight_unit?: string
  local_identifier_name?: string
  local_identifier_value?: string
}

export interface RoomDetail {
  room_id: Id
  hospital_id: string
  hospital_name?: string
  room_name?: string
  floor_name?: string
  active_bed_count?: string
  inactive_bed_count?: string
  no_of_bed?: string
  no_of_occupied?: string
  status?: string | number | boolean
  created_by_name?: string
  updated_by_name?: string | null
  profile_pic?: string | null
  updated_user_profile_pic?: string | null
  updated_by?: string | null
  created_by?: string
  created_at?: string
  updated_at?: string
}

// ==================== Incoming ====================

export type PurposeOfVisit = | 'Checkup' | 'Emergency' | 'Outpatients' | 'Follow-up' | 'Planned' | ''

export type VisitTypeOption = {
  value: PurposeOfVisit
  label: string
}

export type AnimalCategory = 'Single' | 'Group'
export interface AnimalDetails { 
  animal_id: Id
  taxonomy_id: Id
  enclosure_id: Id
  local_id: string
  site_id: Id
  breed_id: Id
  morph_id: Id
  site_name?: string
  breed_name?: string
  morph_name?: string
  local_identifier_value?: string
  local_identifier_name?: string
  local_id_type?: string
  age_formatted?: string
  scientific_name?: string
  common_name?: string
}

export interface Incoming extends HospitalTransferRow {
  user_id?: Id | undefined
  user_name?: string
  user_first_name?: string
  user_last_name?: string
  transfer_reference_code?: string
  purpose?: PurposeOfVisit
  reason_for_rejection?: string | null
  rejected_user_id?: string | null
  rejected_user_name?: string | null
  rejected_user_last_name?: string | null
  rejected_user_profile?: UserAvatarInfo | null
  rejected_at?: string | null
  default_icon?: string | null
}

// ==================== Patient ====================

export type PatientStatus =
  | 'incoming'
  | 'inpatient'
  | 'outpatient'
  | 'discharged'
  | 'followup'
  | 'mortality'
  | string

export interface Patient {
  patient_id?: Id
  id?: Id
  animal_id?: Id
  animal_code?: string
  animal_name?: string
  species_id?: Id
  species_name?: string
  enclosure_id?: Id
  enclosure_name?: string
  hospital_id?: Id
  hospital_name?: string
  room_id?: Id
  bed_id?: Id
  status?: PatientStatus
  admission_date?: string
  discharge_date?: string
  reason_for_admission?: string
  doctor_id?: Id
  staff_ids?: Id[]
  profile_pic?: string
  age?: string | number
  sex?: string
  weight?: string | number
}

export interface InpatientOverview {
  hospital_id: Id
  animal_id: Id
  hospital_name?: string
  hospital_code?: string
  medical_record_code?: string
  medical_record_id: Id
  site_name?: string
  case_id: Id
  case_code?: string
  treatment_type?: PatientStatus
  visit_type?: PurposeOfVisit
  admitted_at?: string
  discharge_at?: string
  case_created_at?: string
  doctor_name?: string
  days_admitted?: string
}

export interface IncomingPatient extends Patient {
  transfer_id?: Id
  transfer_code?: string
  transfer_status?: string
  source_name?: string
  destination_name?: string
}

// ==================== Clinical ====================

export interface Symptom {
  symptom_id?: Id
  id?: Id
  name?: string
  description?: string
  severity?: string
  observed_at?: string
}

export interface Diagnosis {
  diagnosis_id?: Id
  id?: Id
  name?: string
  description?: string
  diagnosed_at?: string
}

export interface ClinicalNote {
  note_id?: Id
  id?: Id
  patient_id?: Id
  note?: string
  created_by?: UserAvatarInfo
  created_at?: string
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

// ==================== Treatment / Prescription ====================

export interface Medicine {
  medicine_id?: Id
  id?: Id
  name?: string
  generic_name?: string
  unit?: string
  dosage_form?: string
}

export interface PrescriptionMedicine {
  prescription_medicine_id?: Id
  medicine_id?: Id
  medicine_name?: string
  dosage?: string | number
  unit?: string
  frequency?: string
  duration?: string | number
  route?: string
  start_date?: string
  end_date?: string
  notes?: string
}

export interface Prescription {
  prescription_id?: Id
  id?: Id
  patient_id?: Id
  medicines?: PrescriptionMedicine[]
  prescribed_by?: UserAvatarInfo
  prescribed_at?: string
  status?: string
}

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

// ==================== Surgery / Anesthesia ====================

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

export interface AnesthesiaRecord {
  anesthesia_id?: Id
  id?: Id
  patient_id?: Id
  drug_name?: string
  dosage?: string | number
  unit?: string
  route?: string
  administered_at?: string
  administered_by?: UserAvatarInfo
}

// ==================== Doctor / Staff ====================

export interface Doctor extends UserAvatarInfo {
  doctor_id?: Id
  specialization?: string
  hospital_id?: Id
}

export interface Staff extends UserAvatarInfo {
  staff_id?: Id
  role?: string
  hospital_id?: Id
}

// ==================== Patient Media ====================

export interface PatientMedia {
  media_id?: Id
  id?: Id
  patient_id?: Id
  url?: string
  type?: string
  uploaded_at?: string
  uploaded_by?: UserAvatarInfo
}

// ==================== Hospital Staffs ====================

export interface HospitalStaff{
  user_full_name?: string
  user_id: Id
  user_profile_pic?: UserAvatarInfo
  role_name?: string
}


// ==================== Form Options ====================

export interface SelectOption<T = string | number> {
  label: string
  value: T
}
