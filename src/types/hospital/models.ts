/**
 * Domain model types for the Hospital module.
 *
 * Add concrete shapes here as APIs/components are converted.
 * Keep optional fields liberally — backend payloads vary across endpoints.
 */

import { string } from "yup"
import { HospitalTransferRow } from "../housing/hospitalTransfer"
import { Dayjs } from "dayjs"
import Id from "src/pages/pharmacy/request/[id]"
// ==================== Generic Helpers ====================

export type Id = string | number
export type StatusAction = 'active' | 'inactive' | 'Active' | 'Inactive'
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

export type DateRangeValue = null | string | number | Date | moment.Moment

export type FilterDate = {
  startDate?: DateRangeValue | null
  endDate?: DateRangeValue | null
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

export type VisitTypeReason = | 'checkup' | 'emergency' | 'opd' | 'follow_up' | 'planned' | ''

export type VisitTypeOption = {
  value: VisitTypeReason
  label: string
}

export type AnimalCategory = 'Single' | 'Group' | 'SINGLE' | 'GROUP' | 'single' | 'group'
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
  purpose?: VisitTypeReason
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

export type PatientAdmissionStatus = | 'admitted' | 'discharge'

export interface PatientAnimalDetail {
  age?: string
  sex?: string
  type?: string
  breed_id?: Id | null
  morph_id?: Id | null
  local_id?: string
  breed_name?: string | null
  morph_name?: string | null
  scientific_name?: string
  weight?: string
  site_id?: Id
  animal_id?: Id
  site_name?: string
  birth_date?: string
  section_id?: Id
  common_name?: string
  default_common_name?: string
  default_icon?: string
  section_name?: string
  complete_name?: string
  total_animal?: number
  user_enclosure_id?: Id
  weight_record_date?: string
  user_enclosure_name?: string
  local_identifier_name?: string
  local_identifier_value?: string
  weight_recorded_date_time?: string
}

export interface CoAttendDoctor {
  id: Id
  name: string
  role?: string
  profile?: string | null
}

export interface PatientDetailsData {
  hospital_case_id?: Id
  hospital_id?: Id
  case_code?: string
  treatment_type?: string
  visit_type?: VisitTypeReason
  purpose_of_visit?: string
  reason_for_admission?: string | null
  status?: PatientAdmissionStatus | string
  room_id?: Id
  room_name?: string
  bed_id?: Id
  bed_name?: string
  bed_code?: string
  attend_by?: Id
  admitted_at?: string
  discharge_at?: string | null
  created_at?: string
  created_from_web?: string
  medical_record_id?: Id
  medical_record_code?: string
  admitted_for_days?: string
  admitted_for_day?: string
  admitted_by_full_name?: string
  created_by_profile_pic?: string
  created_by_full_name?: string
  attend_by_full_name?: string
  attend_by_profile_pic?: string
  attend_by_role?: string
  transfer_created_by?: Id
  transfer_by_full_name?: string
  transfer_by_profile_pic?: string
  transfer_created_at?: string
  visit_number?: string
  is_current_visit?: string
  visit_label?: string
  active_complaints_count?: string
  active_diagnosis_count?: string
  active_prescriptions_count?: string
  treatment_monitoring?: string
  co_attend_doctors?: CoAttendDoctor[]
  animal_detail?: PatientAnimalDetail
  discharge_by_full_name?: string | null
  discharge_by_profile_pic?: string
  is_mortality_case?: string
  transfer_type?: string
  discharge_reason?: string | null
  discharge_type?: string | null
  discharge_care_diet_instruction?: string | null
  discharge_care_restriction?: string | null
  discharge_follow_up_date?: string | null
  hospital_name?: string
  health_status?: string
  animal?: {
    common_name?: string
    scientific_name?: string
    age?: string
    sex?: string
    image_url?: string
  }
  additional_info?: Record<string, string>
}

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

export interface PatientData {
  hospital_case_id: Id
  hospital_id: Id
  case_code: string
  visit_type: VisitTypeReason
  purpose_of_visit: string
  attend_by?: Id
  holding_enclosure?: Id
  created_by?: Id
  created_at?: string
  admitted_at?: string
  admitted_by?: Id
  transfer_id?: Id | null
}

// export interface PatientOverview {
//   active_complaints_count: string
//   active_diagnosis_count: string
//   active_prescriptions_count: string
//   treatment_monitoring: string
//   purpose_of_visit: string
//   created_by_full_name: string
//   created_by_profile_pic: string
//   created_at: string
//   reason_for_admission: string | null
//   status: PatientAdmissionStatus
//   transfer_by_full_name: string
//   transfer_by_profile_pic: string
//   transfer_created_at: string
//   category?: string
// }

export interface VisitHistory {
  hospital_id: Id
  animal_id: Id | null
  hospital_name: string
  hospital_code: string
  medical_record_code: string
  medical_record_id: Id
  site_name: string
  case_id: Id 
  case_code: string
  visit_type: VisitTypeReason
  admitted_at: string
  discharge_at: string
  doctor_name: string
  days_admitted: string
}


// ==================== Clinical ====================

export type Severity = | 'Mild' | 'Moderate' | 'High' | 'Extreme'

export type DurationUnit = | 'Days' | 'Weeks' | 'Months' 

export type SymptomStatus = | 'active' | 'closed' | 'all' | ''

export type EntityType =  | 'complaint' | 'diagnosis'

export type MedicalType = | 'complaint' | 'diagnosis' | 'COMPLAINT' | 'DIAGNOSIS' | 'complaints' | 'prescription'

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

// ==================== Zoo Wise Site List ====================

export interface ZooWiseSiteList {
  site_id: Id
  zoo_id: Id
  cluster_id: Id
  site_name: string
  site_description: string
  site_latitude: string
  site_longitude: string
  site_incharge: string
  site_incharge_number: string
  status: StatusAction
  created_at: string
  modified_at: string | null
  is_deleted: string | number
  geofence_radius_m: null
  site_image: string
}

// ==================== Enclosure wise Section List ====================

export interface EnclosureListSectionWise {
  enclosure_id: Id
  user_enclosure_name: string
  section_id: Id
  section_name: string
  site_name: string
  site_id: Id
  enclosure_parent_id: Id | null
  enclosure_type: string
  parent_enclosure_name: string | null
  enclosure_wise_animal_count: string | number
  species_count: string | number
  sub_enclosure_count: string | number
  image: string
}