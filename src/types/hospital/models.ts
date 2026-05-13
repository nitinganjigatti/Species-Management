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
  weight?: string
  site_id?: Id
  animal_id?: Id
  site_name?: string
  birth_date?: string
  section_id?: Id
  common_name?: string
  default_icon?: string
  section_name?: string
  complete_name?: string
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
  hospital_case_id: Id
  hospital_id: Id
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


// ==================== Patient Media ====================

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
// ==================== Clinical ====================

export type Severity = | 'Mild' | 'Moderate' | 'High' | 'Extreme'

export type DurationUnit = | 'Days' | 'Weeks' | 'Months' 

export type SymptomStatus = | 'active' | 'closed' | 'all' | ''

export type EntityType =  | 'complaint' | 'diagnosis'

export type MedicalType = | 'complaint' | 'diagnosis' | 'COMPLAINT' | 'DIAGNOSIS' | 'complaints' | 'prescription'

export type ClinicalAsmntType = | 'Diagnosis' | 'Tentative' | "diagnosis" | "tentative" 

export type Prognosis = | 'Favourable' | 'Guarded' | 'Doubtful' | 'Poor' | 'Grave' | 'favourable' | 'guarded' | 'doubtful' | 'poor' | 'grave'


export type DiagnosisNoteType = | 'comment' | 'note'

export type MedicalStatus = | 'resolved' | 'active'

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

export interface Category {
  id?: Id
  med_cat_id?: Id
  label?: string
  category?: string
  key?: string
  type?: MedicalType
  zoo_id?: number
}
export interface Template {
  id: Id
  template_name: string
  type: MedicalType
  template_items: TemplateItems[]
  created_at: string
  modified_at: string
  deleted_at?: string | null
  is_deleted?: string | null
}
export interface TemplateItems {
  id: Id
  name: string
  string_id?: string
}

export interface TransformedTemplateItems {
  id: Id
  name: string
  template_items: TemplateItems[]
}

export interface ComplaintsDiagnosisTemplates {
  id: Id
  template_name: string
  type: MedicalType
  template_items: TemplateItems[]
  message: string
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

export interface BaseMedicalNotes {
  isSystemGenerated: boolean
  createdBy: Id
  formattedTime: string
  oldSeverity: Severity
  newSeverity: Severity
  oldRecord: string
  newRecord: string
}
export interface ComplaintNotes  {
  note: string
  created_at: string
  notes_dump: NotesDump
  modified_at?: string | null
  duration_unit: DurationUnit
  created_by_user_name: string
  is_system_generated: number
}

export interface DiagnosisNotes  {
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


export interface AddSymptomsCard {
  id?: Id
  medical_record_id?: Id
  name?: string
  string_id?: string
  medical_complaint_id?: Id
  additionalInfo?: SymptomsClinicalAdditionalInfo
  latest_note?: string[]
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
