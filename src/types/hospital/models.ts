/**
 * Domain model types for the Hospital module.
 *
 * Add concrete shapes here as APIs/components are converted.
 * Keep optional fields liberally — backend payloads vary across endpoints.
 */

// ==================== Generic Helpers ====================

export type Id = string | number

export interface UserAvatarInfo {
  user_id?: Id
  first_name?: string
  last_name?: string
  profile_pic?: string
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

export interface HospitalBed {
  bed_id?: Id
  id?: Id
  room_id?: Id
  hospital_id?: Id
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

// ==================== Form Options ====================

export interface SelectOption<T = string | number> {
  label: string
  value: T
}
