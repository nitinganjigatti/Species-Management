/**
 * Prescription / medicine domain model types for the Hospital module.
 *
 * Extracted from the monolithic `src/types/hospital/models.ts`.
 * Medical-master types (`MedicalCaseType`, `MedicalRecommendedAdvice`,
 * `MedicalLabTest*`, `MedicalMostUsedLabTest`, `MedicalDefaultVital`) also live
 * in this file — they're consumed almost exclusively by the prescription /
 * medical-record flow, so colocating them avoids a cross-file dependency.
 */

import type {
  Id,
  UserAvatarInfo,
  PatientAnimalDetail,
  StatusAction
} from '../models'

// ==================== Core prescription / medicine ====================

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

export interface MedicineList {
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

// ==================== Status / type unions ====================

export type PrescriptionStatus = 'active' | 'completed' | 'stopped' | 'all' | 'restart' | 'stop'

export type PrescriptionFrequency =
  | 'at_regular_intervals'
  | 'on_specific_days'
  | 'At Regular Intervals'
  | 'On Specific Days'
  | 'one_time'

export type PrescriptionScheduleStatus =
  | 'Pending'
  | 'Administered'
  | 'Stopped'
  | 'Skipped'
  | 'pending'
  | 'administrator'
  | 'withheld'
  | 'stopped'
  | 'administered'

export type DurationType = 'Days' | 'Weeks'

export type DosePurpose = 'administer' | 'withheld'

export type ApplyDosage = 'only_for_this_day' | 'till_prescription_end'

// ==================== Schedule / list items ====================

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

// ==================== Master options used inside prescription forms ====================

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
  unit_name: string
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
  value: string
  delivery_route_string_id?: string
}

// ==================== Detail / timing models ====================

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
  medicine_timings?: PrescriptionMedicineTiming[]
  dose_count?: number
  show_stop_button?: boolean
  group_prescription_id?: Id
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
  intervalList?: unknown[]
}

export interface PrescriptionFrequencyList {
  id: Id
  value?: Id
  label: PrescriptionFrequency | string
  string_id?: string
  translation_string_id?: string
}

export interface PrescriptionIntervalList {
  id: string
  label: string
  string_id?: string
  interval_string_id?: string
  value?: string
}

// ==================== Add / restart / direct administer ====================

export interface AddPrescriptionScheduleDose {
  id: Id | ''
  time: string
  quantity: number | string
  unit_id: Id
  unit_name: string
  string_id: string
  old_time?: string
  created_at?: string
  unit: string
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
  group_prescription_id: Id
  id: Id
  customDate: string
  administrative_ids: Id
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
  unit: string
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
  interval_id?: Id
  interval_string_id?: string
  label: string
  name: string
  notes: string
  restart_reason: string
  stop_reason: string
  side_effect: Boolean
  schedule_doses: RestartStopMedicineScheduleDose[]
}

// ==================== Prescription record / medication params ====================

export interface PrescriptionRecord {
  prescription_id: Id
  when: string | null
  group_prescription_id: Id
  id: Id
  controlled_substance: boolean
  side_effect: boolean
  medical_record_id: Id
  created_for: string
  dose_type: string
  weight_dose: WeightDose
  delivery_route_id: Id
  delivery_route_name: string
  delivery_route: string
  delivery_route_string_id: string
  frequency: PrescriptionFrequency
  frequency_compare: PrescriptionFrequency
  frequency_string_id: string
  interval_id: Id
  interval: string
  interval_string_id: string
  notes: string
  start_date: string
  stop_date: string | null
  end_date: string | null
  status: StatusAction
  stop_reason: string
  is_new_data: Id
  restart_reason: string
  will_restart: boolean
  duration_qty: string | number
  dosage: string | null
  duration: string
  duration_type: string
  duration_string_id: string
  duration_id: Id
  created_at: string
  dosage_count: string
  gid: Id
  type: string
  name: string
  label: string
  generic_name: string
  composition: null
  schedule_dose: AddPrescriptionScheduleDose[]
  created_by_name: string
  medical_record_code: string
  dose_type_label: string
  frequency_id: Id
  frequency_key: PrescriptionFrequency
}

export interface PrescriptionMedicationParams {
  id: Id
  label: string
  name: string
  generic_name: string | null
  total_qty: string
  total_central_store_qty: string
  total_local_store_qty: string
  frequency_key: PrescriptionFrequency
  frequency_id: Id
  frequency: string | number
  frequency_string_id: string
  frequency_name: PrescriptionFrequency
  schedule_doses: AddPrescriptionScheduleDose[]
  interval: string
  interval_id: Id
  interval_string_id: string
  duration_qty: number | string
  duration_id: Id
  duration: string
  duration_string_id: string
  duration_type: string
  notes: string
  delivery_route_name: string
  delivery_route_id: Id
  delivery_route_string_id: string
  delivery_route_label: string
  start_date: string
  end_date: string
  restart_reason: string
  stop_reason: string
  will_restart: boolean
  side_effect: boolean
  created_for: string
  administer_date: string
  batch_list?: PrescriptionMedicineBatchDetail[] | []
  dose_type: string
  select_medicine_type: 'Schedule' | 'Direct Administer'
}

// ==================== Medical master data (case types / advices / lab tests / vitals) ====================

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
