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

export interface MedicineList{
  id: Id
  name: string
  generic_name?: string
  composition?: string
  dose_form?: string
  total_central_store_qty?: string
  total_local_store_qty?: string
  total_qty?: string
  controlled_substance?: number
}

export type PrescriptionStatus = 'active' | 'completed' | 'stopped' | 'all' | 'restart' | 'stop'

export type PrescriptionFrequency =
  | 'at_regular_intervals'
  | 'on_specific_days' | 'At Regular Intervals' | 'On Specific Days' | 'one_time'

export type PrescriptionScheduleStatus =
  | 'Pending'
  | 'Administered'
  | 'Stopped'
  | 'Skipped'

  export type DurationType = 
  | 'Days'
  | 'Weeks'

export type DosePurpose = | 'administer' | 'withheld'

export type ApplyDosage = | 'only_for_this_day' | 'till_prescription_end'
export interface PrescriptionScheduleItem {
  schedule_id: Id
  time: string
  dosage?: string
  status?: PrescriptionScheduleStatus
  administered_time?: string | null
  compliance_note?: string | null
  administrative_id?: Id
  medicine_id?: Id
  prescription_id?: Id
  administered_date?: string | null
  total_schedule_count?: number
  total_administer_count?: number
  total_pending_count?: number
  prescription_pending_count?: number
  total_stopped_count?: number
  administrative_ids?: Id[]
}

export interface PrescriptionList {
  id: Id
  name: string
  label?: string
  medical_record_id?: string
  prescription_id?: Id
  frequency?: PrescriptionFrequency
  controlled_substance?: string | number
  side_effects?: string | number
  group_prescription_id?: Id
  prescription_start_date?: string
  prescription_stop_date?: string | null
  prescription_end_date?: string | null
  schedule?: PrescriptionScheduleItem[]
  progress?: string
  status?: PrescriptionScheduleStatus | string | null
  canEdit?: boolean
  pending_prescription_administer?: number
}

export interface MedicineSideEffect {
  id: Id
  animal_id: Id
  medicine_id: Id
  reason?: string | null
  zoo_id?: Id
  enclosure_id?: Id
  section_id?: Id
  name?: string
  created_at?: string
  created_by?: Id
  description?: string | null
  controlled_substance?: string | number
}
export interface MedicineBatchList {
  id: Id
  batch_no: string
  expiry_date: string
}

// ==================== Medical Master Data ====================
export interface MedicalCaseType {
  id: Id
  label: string
  string_id?: string
  default_icon?: string
  color_code?: string
  description?: string
  active?: string | number
  zoo_id?: Id
  created_by?: Id
  created_on?: string
}

export interface PrescriptionMeasurementType {
  id: Id
  unit_name: string
  uom_abbr: string
  string_id?: string
}

export type PrescriptionDosageType = 'Dosage' 

export interface PrescriptionDosageMeasurementType {
  id: Id
  key: string
  string_id?: string
  label: string
  dosage_type?: PrescriptionDosageType
  description?: string | null
  zoo_id?: Id | null
  active?: string | number
  created_by?: Id
  created_on?: string
  value: string
  unit_name?: string
  uom_abbr?: string
}

export interface PrescriptionDurationOption {
  id: Id
  key: string
  string_id?: string
  label: string
  show_duration_field?: string | number
  is_deleted?: string | number
  created_by?: Id
  created_at?: string
  value?: string
}

export interface PrescriptionFrequencyOption {
  id: Id
  key?: string
  string_id?: string
  label: string
  show_freq_field?: string | number
  is_deleted?: string | number
  created_by?: Id
  created_at?: string
  value?: Id
}

export interface PrescriptionDeliveryRoute {
  id: Id
  delivery: string
  route_abbr: string
  string_id?: string
  zoo_id?: Id
  is_deleted?: string | number
  created_at?: string
  modified_at?: string | null
  created_by?: Id
  modified_by?: Id | null
  label?: string
  value?: string
}

export interface MedicalRecommendedAdvice {
  id: Id
  label: string
  string_id?: string
  active?: string | number
  zoo_id?: Id | null
  created_by?: Id
  created_on?: string | null
}

export type MedicalLabTestInputType = 'CheckBox' | 'Radio' | 'Text' | 'Number' | string

export interface MedicalLabTest {
  test_id: Id
  full_test?: boolean
  string_id?: string
  test_name: string
  child_tests?: MedicalLabTest[]
  input_type?: MedicalLabTestInputType
  value?: boolean | string | number | null
}

export interface MedicalLabTestSample {
  sample_id: Id
  sample_name: string
  string_id?: string
  tests: MedicalLabTest[]
}

export interface MedicalMostUsedLabTest {
  id: Id
  label: string
  string_id?: string
  mostly_use_count?: string | number
}

export interface MedicalDefaultVital {
  assessment_type_id: Id
  description?: string
  assessments_type_label: string
  string_id?: string
  category_string_id?: string
  assessment_category_id?: Id
  response_type?: string
  measurement_type?: string
  active?: string | number
  created_by?: Id
  updated_by?: Id
  created_on?: string
  updated_on?: string
  label?: string
  zoo_id?: Id
  template_count?: string | number
  default_values?: unknown
}

export interface PrescriptionMedicineBatchDetail {
  batch_id?: Id
  batch_no?: string
  batch_no_image?: string
  batch_note?: string
  expiry_date?: string
  quantity?: string | number
  unit?: string
  wastage_qty?: string | number
  wastage_unit_name?: string
  [key: string]: unknown
}

export interface PrescriptionMedicineTiming {
  administritive_id?: Id
  administritive_unit_id?: Id | null
  modified_at?: string | null
  wastage_unit_id?: Id | null
  quantity_administered?: string | number | null
  wastage_quantity?: string | number | null
  scheduled_quantity?: string | number
  scheduled_time?: string
  scheduled_unit_name?: string
  scheduled_unit_id?: Id
  string_id?: string | null
  scheduled_dose_id?: Id
  created_at?: string
  status?: string | null
  reason?: string | null
  variant?: string
  dosage?: string
  wastage_note: string
  notes?: string
  administritive_date?: string | null
  administritive_time?: string | null
  job_id?: Id | null
  user_profile_pic?: string | null
  user_full_name?: string | null
  user_mobile_number?: string | null
  user_country_code?: string | null
  stopped_date?: string | null
  controlled_substance?: string | number
  batch_details?: PrescriptionMedicineBatchDetail[]
  batch_details_required?: boolean
}

export interface PrescriptionDetails {
  medical_record_code?: string
  interval?: string
  medical_record_id?: Id
  prescription_id?: Id
  created_at?: string
  created_by?: Id
  updated_by?: Id | null
  updated_at?: string | null
  notes?: string
  duration?: string
  will_restart?: string | number
  is_new_data?: string | number
  stop_date?: string | null
  animal_details?: PatientAnimalDetail
  medical_record_type?: string
  total_animal?: string | number
  frequency?: string
  prescription_frequency?: PrescriptionFrequency
  interval_label?: string
  duration_string_id?: string
  duration_label?: string
  duration_qty?: string | number
  interval_string_id?: string
  frequency_string_id?: string
  delivery_route_name?: string
  delivery_route_string_id?: string
  controlled_substance?: string | number
  medicine_name?: string
  start_date?: string
  end_date?: string
  composition_name?: string
  medicine_id?: Id
  side_effect?: string | number
  created_for?: string
  prescription_created_for?: string
  medicine_timings: PrescriptionMedicineTiming[]
  dose_count?: number
  show_stop_button?: boolean
}

export interface PrescriptionMasterData {
    caseTypes: MedicalCaseType[]
    prescriptionMeasurementType: PrescriptionMeasurementType[]
    prescriptionDosageMeasurementType: PrescriptionDosageMeasurementType[]
    prescriptionDuration: PrescriptionDurationOption[]
    prescriptionFrequency: PrescriptionFrequencyOption[]
    prescriptionDeliveryRoute: PrescriptionDeliveryRoute[]
    recommendedAdvices: MedicalRecommendedAdvice[]
    labTests: MedicalLabTestSample[]
    recentlyUsedLabTests: MedicalMostUsedLabTest[]
    mostUsedLabTests: MedicalMostUsedLabTest[]
    defaultVitals: MedicalDefaultVital[]
}

export interface PrescriptionFrequencyList {
  id: Id
  value?: Id
  label: PrescriptionFrequency
  string_id?: string
  translation_string_id?: string
}

export interface TransformedPrescriptionFrequency extends PrescriptionFrequencyList{
  value: Id
}

export interface PrescriptionIntervalList {
  id: string
  label: string
  string_id?: string
  interval_string_id?: string
  value?: string
}

export interface AddPrescriptionScheduleDose {
  id: Id | ''                              
  time: string
  quantity: number | string 
  unit_id: Id                                                   
  unit_name: string                         
  string_id: string                     
  old_time?: string
  created_at?: string     
}

export interface AddPrescriptionParamList {
  id: Id
  label: string
  name: string
  total_qty: string | number
  total_central_store_qty: string | number
  total_local_store_qty: string | number
  frequency_key: string
  frequency_id: Id
  frequency: string
  frequency_string_id?: string
  schedule_doses: AddPrescriptionScheduleDose[]
  interval: string
  interval_id: Id
  interval_string_id?: string
  duration_qty: string | number
  duration_id: Id
  duration: string
  duration_string_id?: string
  duration_type: string
  notes: string
  delivery_route_name: string
  delivery_route_id: Id
  delivery_route_string_id?: string
  start_date: string
  end_date: string
  restart_reason: string
  stop_reason: string
  will_restart: boolean
  side_effect: boolean
  created_for: string
  administer_date: string
  batch_list: PrescriptionMedicineBatchDetail[]
  dose_type: string
}

export interface WeightDose {
  unit_id: Id | null
  string_id?: string | null
  unit_name: string | null
}

export interface AddPrescriptionResponseList {
  prescription_id: Id
  follow_up_date?: string | null
  when?: string | null
  group_prescription_id: Id
  id: Id
  controlled_substance: boolean
  side_effect: boolean
  medical_record_id: Id
  created_for: string
  created_by: string
  dose_type: string
  weight_dose: WeightDose
  delivery_route_id: Id
  delivery_route_name: string
  delivery_route_string_id?: string
  frequency: PrescriptionFrequency
  frequency_compare: PrescriptionFrequency
  frequency_string_id?: string
  interval_id: Id
  interval: string
  interval_string_id?: string
  notes: string
  start_date: string
  stop_date: string | null
  show_stop_button: string
  administer_date: string | null
  end_date: string | null
  status: PrescriptionScheduleStatus
  stop_reason: string
  is_new_data: string
  restart_reason: string
  will_restart: boolean
  duration_qty: string
  dosage: null | string | number
  duration: string
  duration_type: DurationType
  duration_string_id?: string
  duration_id: Id
  created_at: string
  schedule_doses: AddPrescriptionScheduleDose[]
  gid?: null | Id
  type: string
  name: string
  label: string
  generic_name: string | null
  composition_name: string
  total_central_store_qty: string
  total_local_store_qty: string
  total_qty: string
  is_administer_pending: string
  frequency_id: number
  frequency_key: PrescriptionFrequency
}

export interface RestartStopMedicineScheduleDose {
  id: Id
  time: string
  unit_id: Id
  old_time: string
  quantity: string | number
  string_id?: string | null
  unit_name: string
  created_at: string
}

export interface RestartStopMedicineItem {
  prescription_id?: Id
  medical_record_id?: Id
  created_for?: string
  when?: string | null
  delivery_route_id: Id
  delivery_route_name: string
  delivery_route_string_id?: string
  frequency: string
  interval_id: Id
  interval: string
  notes: string
  start_date: string
  stop_date: string | null
  end_date: string | null
  is_new_data: string
  stop_reason: string
  restart_reason: string
  will_restart: boolean
  duration_qty: string
  duration_id: Id
  dosage: string | number | null
  created_at: string
  id: Id
  controlled_substance: boolean
  name: string
  gid: Id | null
  generic_name: string | null
  weight_dose: WeightDose
  follow_up_date: string | null
  schedule_doses: RestartStopMedicineScheduleDose[]
  side_effect: boolean
  total_central_store_qty: string
  total_local_store_qty: string
  total_qty: string
  is_administer_pending: string
  show_stop_button: string
  administer_date: string | null
  status: string
  group_prescription_id: Id
  dose_type: string
  frequency_compare: string
  frequency_string_id?: string
  interval_string_id?: string
  duration: string
  duration_type: DurationType
  duration_string_id?: string
  type: string
  label: string
  composition: string | null
  frequency_id: Id
  frequency_key: string
}

export interface PrescriptionDates {
  date: string
  pending_count: string
  group_prescription_id?: Id
  id?: Id
}

export interface AdministerDoseBatchDetails {
  id: Id
  batch_id: Id
  animal_id: Id
  wastage_quantity: string
  reason: string
  wastage_unit: string 
}

export interface AddDosageScheduleInfo {
  time: string
  quantity: number
  unit_id: Id
  dosageQuantity: number
  dosageUnit: string
}

export interface DirectAdministerScheduleDose {
  id: Id
  time: string
  notes: string
  quantity: number
  unit_id: Id
  unit_name: string
  string_id?: Id
  batch_list: PrescriptionMedicineBatchDetail[] | null
  files: string | null
}

export interface AddDirectAdministerPastSlotParams {
  id: Id
  start_date: string
  end_date: string
  notes: string
  schedule_doses: DirectAdministerScheduleDose
  batch_list: any
  files: any
}

export interface RestartMedicineDetails {
  delivery_route_id: Id
  delivery_route_name: string
  delivery_route_string_id: string
  duration: string
  duration_id?: Id
  duration_qty?: string | number
  duration_string_id?: string
  duration_type: DurationType | string
  start_date: string
  end_date: string
  frequency: string | number
  frequency_id: Id
  frequency_key: string
  frequency_string_id: string
  group_prescription_id: Id
  id: Id
  interval: string
  interval_id?: string
  interval_string_id?: string
  label: string
  name: string
  notes: string
  restart_reason: string
  stop_reason: string
  side_effect: Boolean
  schedule_doses: RestartStopMedicineScheduleDose[]
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

// ==================== Other Treatments ====================

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


// ==================== Treatment Monitoring ====================

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

// ==================== Medical Summary ====================


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


// ==================== Anesthesia ====================

export type DeliveryStatus = | 'Complete' | 'Partial' | 'None'

export type EstimatedUnit = | 'hr' | 'min' | string

export interface AnesthesiaDetailOption {
  label?: string
  value?: string | number | null
}

export interface AnesthesiaMedicationRow {
  id: Id
  drug: string
  purpose: string
  amount: string
  route: string | number
  deliveryTime: string
  deliveryStatus: DeliveryStatus | string
  maxEffect: string
  notes: string
}

export interface AnesthesiaRecordItem extends AnesthesiaDetails {
  procedures?: string[]
  createdOn?: string
  createdBy?: string
  time?: string
}

export interface AnesthesiaMonitoringState {
  selected?: number[]
  otherItems?: string[]
}

export interface AnesthesiaSetupSectionFieldEntry {
  field_value?: string
  unit?: string
}

export interface AnesthesiaSetupSectionState {
  checked?: boolean
  monitoring?: AnesthesiaMonitoringState
  fields?: Record<string, AnesthesiaSetupSectionFieldEntry>
  [key: string]: unknown
}

export interface MonitoringToggleItem {
  id: number
  name: string
}

export interface AnesthesiaSetupRow {
  key: string
  label?: string
  meta: AnesthesiaSetup
}

export interface PreAnesthesiaSelectOption {
  value: string | number
  label: string
}

export interface MedicationDrugOption {
  id?: Id
  name?: string
  drug_id?: Id
}

export interface UnitParams {
  id?: Id
  uom_abbr?: string
  name?: string
}

export interface AnesthesiaGasRow {
  id: Id
  gas: string
  o2: string
  concentration: string | number
  route: string
  startTime: string
  endTime: string
}

export interface AnesthesiaReversalRow {
  id: Id
  drug: string
  amount: string | number
  route: string
  deliveryTime: string | number
  deliveryStatus: DeliveryStatus | string
  maxEffect: string
}
export interface AnesthesiaDetails {
  id?: Id
  anaesthesia_id: Id
  code: string
  hospital_case_id: Id
  medical_record_id: Id
  anaesthesia_datetime: string
  location: string
  estimated_time_required: number | string
  estimated_time_unit: string
  veterinarian_id: Id[]
  anesthetist_id: Id[]
  notes: string
  created_by: string
  created_at: string
  created_by_name: string
  created_by_role: string
  updated_at: string
  updated_by: string
  veterinarians: DoctorDetails[]
  anesthetists: DoctorDetails[]
  purpose: AnesthesiaAssessmentType[]
  anaesthesia_setup: AnesthesiaSetup[]
  pre_anaesthesia: PreAnesthesia
  anaesthesia_medications: AnaesthesiaMedications
  vital_monitoring: VitalMonitoring
  recovery_and_reversal: RecoveryAndReversal
  attachments: Attachments
}

export interface DoctorDetails {
  user_id?: Id
  full_name?: string
  role_name?: string
  default_icon?: string | UserAvatarInfo
  id?: Id
  doctor_id?: Id
  user_full_name?: string
  name?: string
  is_hospital_chief_doctor?: string | number
  value?: string
  label?: string
}

export interface DoctorOption {
  label?: string
  value?: string
}

export interface AnesthesiaAssessmentType {
  id: Id
  type: string
  name: string
  is_other: number | string | boolean
  created_at: string
  is_selected: number | string | boolean
}
export interface AnesthesiaSetup {
  section_id: Id
  section_name: string  
  string_id?: string
  type: string
  fields: AnesthesiaSetupFields[]
  monitoring_items: AnesthesiaAssessmentType[]
}

export interface AnesthesiaSetupFields {
  field_id: Id
  field_key: string
  field_label: string
  input_type: string
  options: string[]
  units: string[]
  field_value: string
  unit: string | null
}

export interface PreAnesthesia {
  id: Id
  anaesthesia_id: Id
  temperature: string | number
  humidity: string | number
  physical_health_status: string
  body_condition: string
  animal_activity: string
  fasting_time: string | number
  fasting_unit: string
  previous_endotracheal_tube_size: string
  code_status: string
  weight: string | number
  weight_unit: string
  weight_type: string
  pre_anesthesia_notes: string
  created_by: Id
  created_at: string
  clin_path: AnesthesiaAssessmentType[]
}
export interface AnaesthesiaMedications {
  medication: {
    total: string | number
    records: Medications[]
  }
  gas: {
    total: string | number
    records: Gas[]
  }
}

export interface Medications {
  id: Id
  anaesthesia_id: Id
  type: string
  drug_id: Id
  drug_name: string
  route: string | number
  delivery_status: DeliveryStatus
  created_at: string
  purpose_stage: string
  amount: number | string
  unit_id: Id
  unit_name: string
  uom_abbr: string
  delivery_time: string
  max_effect: string
  comments: string
}

export interface Gas {
  id: Id
  anaesthesia_id: Id
  type: string
  drug_id: Id
  drug_name: string
  route: string
  delivery_status: DeliveryStatus
  created_at: string
  oxygen_l_min: number | string
  concentration: number | string
  start_time: string
  end_time: string
  comments?: string
}

export interface VitalMonitoring {
  time_slots: VitalMonitoringTimeSlots[]
  records: VitalMonitoringRecords[]
}

export interface VitalMonitoringTimeSlots {
  id: Id
  recorded_time?: string
  monitoring_time_id?: Id
  label?: string
}

export interface VitalMonitoringRecords {
  section_id: Id
  section_name: string
  string_id?: string
  type: string
  fields: VitalMonitoringFields[]
}

export interface VitalMonitoringFields {
  field_id: Id
  field_key: string
  field_label: string
  input_type: string
  options: string[]
  units: string[]
  values: VitalMonitoringValues[]
  field_value?: string | number | null
  unit?: string | null
}

export interface VitalMonitoringValues {
  monitoring_time_id: Id
  field_value: string | number
  unit: string
}

export interface RecoveryAndReversal {
  recovery: Recovery
  reversal: {
    total: string | number
    records: Reversal[]
  }
}

export interface Recovery {
  id: Id
  anaesthesia_id: Id
  recovery_type: string
  recovery_first_effect_time: string
  recovery_full_effect_time: string
  describe_problem:string
  notes: string
  rating_induction: string
  rating_tolerance: string
  rating_recovery: string
  rating_overall: string
  created_by: Id
  created_at: string
}

export interface Reversal {
  id: Id
  anaesthesia_id: Id
  type: string
  drug_id: Id 
  drug_name: string
  route: string
  delivery_status: DeliveryStatus
  created_at: string
  amount: string | number
  unit_id: Id
  unit_name: string
  uom_abbr: string
  delivery_time: string
  comments: string | null
  max_effect: string
}

export interface Attachments {
  total: string | number
  records: []
}

export interface DeliveryRoute {
  id: Id
  delivery: Id
  route_abbr: string | number
  string_id?: string
  zoo_id: Id
  is_deleted: string | number
  created_at: string
  modified_at: string
  created_by: Id
  modified_by: Id | null
}

// ==================== Surgery ====================

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

export interface SurgeryMaster {
  id: Id
  zoo_id: Id
  surgery_name: string
  description: string
  status: StatusAction
  created_at: string 
  created_by: Id
  updated_at: string | null
  updated_by: Id | null
  is_deleted: string | number
  deleted_at: string | null
  deleted_by: Id | null
}

export interface SurgeryTemplateList {
  id: Id
  template_name: string
  type: string
  description: string
  status: StatusAction
  hospital_id: Id
  zoo_id: Id
  created_at: string
}

export interface SurgeryTemplateAction {
  template_id: Id
}

// ==================== Media ====================

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


