/**
 * Core entity types for the Necropsy module
 */

// ==================== Necropsy Center ====================

export interface NecropsyCenter {
  id: number
  name: string
  code?: string
  address?: string
  site_id?: number
  site_name?: string
  contact_person?: string
  contact_number?: string
  email?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

// ==================== Necropsy Stats ====================

export interface NecropsyStats {
  INCOMING: number
  PENDING: number
  DRAFT: number
  COMPLETED: number
  CARCASS_TRANSFER: number
}

export type ActiveCard = keyof NecropsyStats

// ==================== Animal Related ====================

export interface AnimalNecropsyItem {
  mortality_id: number
  mortality_guid?: string
  animal_id: number
  animal_guid?: string
  animal_code?: string
  local_id?: string
  default_icon?: string
  sex_type?: string
  age_class?: string
  tsn?: string
  species_name?: string
  default_common_name?: string
  scientific_name?: string
  site_id?: number
  site_name?: string
  section_id?: number
  section_name?: string
  enclosure_id?: number
  enclosure_name?: string
  mortality_created_at?: string
  mortality_date?: string
  status?: string
  priority?: string
  necropsy_status?: string
  necropsy_on_site?: boolean
  necropsy_conducted_by?: string
  created_by?: string
  created_by_name?: string
  necropsy_center_id?: number
  necropsy_center_name?: string
  manner_of_death?: string
  carcass_disposition?: string
  transfer_id?: number
  transfer_status?: string
}

export interface IndexedAnimalRow extends AnimalNecropsyItem {
  id: number
  sl_no: number
}

// ==================== Species Related ====================

export interface SpeciesNecropsyItem {
  tsn: string
  default_common_name?: string
  scientific_name?: string
  default_icon?: string
  count: number
}

export interface IndexedSpeciesRow extends SpeciesNecropsyItem {
  id: string | number
  sl_no: number
  species_name: string
}

// ==================== Mortality & Summary ====================

export interface MortalitySummary {
  total_mortality?: number
  pending_necropsy?: number
  completed_necropsy?: number
  incoming_count?: number
  draft_count?: number
  transfer_count?: number
  necropsy_id?: number | string
  mortality_id?: number | string
  animal_id?: number | string
  animal_code?: string
  species_name?: string
  default_icon?: string
  sex_type?: string
  age_class?: string
  site_name?: string
  section_name?: string
  enclosure_name?: string
  mortality_date?: string
  discovered_date?: string
  caracass_condition?: string
  user_full_name?: string
  reported_by?: string
  created_at?: string
  user_mobile_number?: string
  request_id?: string
  [key: string]: unknown
}

export interface NecropsySummary {
  necropsy_id?: number
  necropsy_guid?: string
  animal_id?: number
  animal_guid?: string
  animal_code?: string
  local_id?: string
  species_name?: string
  scientific_name?: string
  default_common_name?: string
  default_icon?: string
  sex_type?: string
  age_class?: string
  site_name?: string
  section_name?: string
  enclosure_name?: string
  mortality_date?: string
  necropsy_date?: string
  status?: string
  necropsy_status?: string
  manner_of_death?: string
  manner_of_death_id?: number
  carcass_disposition?: string
  carcass_disposition_id?: number
  gross_findings?: string
  histopathology_findings?: string
  final_diagnosis?: string
  comments?: string
  weight?: number
  weight_unit?: string
  weight_unit_id?: number
  necropsy_center_id?: number
  necropsy_center_name?: string
  necropsy_conducted_by?: number
  necropsy_conducted_by_name?: string
  created_by?: number
  created_by_name?: string
  created_at?: string
  updated_at?: string
  attachments?: NecropsyAttachment[]
  organs?: NecropsyOrgan[]
}

export interface NecropsyAttachment {
  id: number
  file_name?: string
  file_path?: string
  file_type?: string
  file_size?: number
  upload_type?: string
  created_at?: string
}

// ==================== Carcass Transfer ====================

export interface CarcassTransfer {
  transfer_id: number
  transfer_guid?: string
  transfer_code?: string
  from_site_id?: number
  from_site_name?: string
  to_site_id?: number
  to_site_name?: string
  from_necropsy_center_id?: number
  from_necropsy_center_name?: string
  to_necropsy_center_id?: number
  to_necropsy_center_name?: string
  status?: string
  transfer_status?: string
  animal_count?: number
  species_count?: number
  transfer_date?: string
  arrival_date?: string
  created_by?: number
  created_by_name?: string
  created_at?: string
  updated_at?: string
  animals?: TransferAnimal[]
  checklist?: TransferChecklist[]
}

export interface TransferAnimal {
  animal_id: number
  animal_guid?: string
  animal_code?: string
  local_id?: string
  species_name?: string
  scientific_name?: string
  default_common_name?: string
  default_icon?: string
  sex_type?: string
  age_class?: string
  mortality_id?: number
  mortality_date?: string
  necropsy_status?: string
}

export interface TransferChecklist {
  checklist_id: number
  checklist_item?: string
  is_checked?: boolean
  checked_by?: number
  checked_by_name?: string
  checked_at?: string
  notes?: string
}

export interface TransferChecklistItem {
  id: number
  name: string
  description?: string
  is_required?: boolean
  order?: number
}

export interface FilledChecklistItem {
  checklist_id: number
  checklist_item_id: number
  is_filled: boolean
  filled_by?: number
  filled_by_name?: string
  filled_at?: string
  notes?: string
}

// ==================== Incoming Necropsy ====================

export interface IncomingNecropsySummary {
  transfer_id: number
  transfer_guid?: string
  transfer_code?: string
  from_site_name?: string
  to_site_name?: string
  from_necropsy_center_name?: string
  to_necropsy_center_name?: string
  status?: string
  animal_count?: number
  species_count?: number
  transfer_date?: string
  arrival_date?: string
  created_by_name?: string
  created_at?: string
  vehicle_number?: string
  driver_name?: string
  driver_mobile?: string
  sender_name?: string
  sender_mobile?: string
  receiver_name?: string
  receiver_mobile?: string
  comments?: IncomingNecropsyComment[]
  animals?: TransferAnimal[]
}

export interface IncomingNecropsyComment {
  comment_id: number
  comment?: string
  commented_by?: number
  commented_by_name?: string
  commented_by_avatar?: string
  commented_on?: string
}

export interface IncomingNecropsyBtnStatus {
  can_accept?: boolean
  can_reject?: boolean
  is_accepted?: boolean
  is_rejected?: boolean
  accepted_by?: string
  rejected_by?: string
  accepted_at?: string
  rejected_at?: string
}

// ==================== Lab Related ====================

export interface LabRequest {
  request_id: number
  request_guid?: string
  request_code?: string
  lab_code?: string
  animal_id?: number
  animal_guid?: string
  animal_code?: string
  species_name?: string
  sample_count?: number
  test_count?: number
  status?: string
  priority?: string
  requested_by?: number
  requested_by_name?: string
  requested_at?: string
  completed_at?: string
}

export interface LabSample {
  sample_id: number
  sample_guid?: string
  sample_code?: string
  sample_type?: string
  sample_type_name?: string
  collection_date?: string
  collection_site?: string
  collected_by?: string
  status?: string
  notes?: string
  tests?: LabTest[]
}

export interface LabTest {
  test_id: number
  test_code?: string
  test_name?: string
  category?: string
  status?: string
  result?: string
  result_value?: string
  reference_range?: string
  unit?: string
  is_abnormal?: boolean
  performed_by?: string
  performed_at?: string
  verified_by?: string
  verified_at?: string
  sub_tests?: LabSubTest[]
}

export interface LabSubTest {
  subtest_id: number
  subtest_name?: string
  result_value?: string
  reference_range?: string
  unit?: string
  is_abnormal?: boolean
}

export interface SampleLog {
  log_id: number
  sample_id?: number
  action?: string
  action_by?: string
  action_at?: string
  notes?: string
}

export interface LabNote {
  note_id: number
  note?: string
  created_by?: string
  created_at?: string
}

export interface LabReport {
  report_id: number
  file_name?: string
  file_path?: string
  file_type?: string
  created_at?: string
}

// ==================== Necropsy Template ====================

export interface NecropsyTemplate {
  template_id: number
  template_name: string
  description?: string
  is_default?: boolean
  is_active?: boolean
  body_parts?: BodyPart[]
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface BodyPart {
  id?: string | number
  body_part_id?: number
  body_section_id?: string | number
  body_part_name?: string
  label?: string
  name?: string
  description?: string
  order?: number
  is_active?: boolean
  organs?: BodyPartOrgan[]
  parts?: BodyPartOrgan[]
}

export interface BodyPartOrgan {
  id?: string | number
  organ_id?: number
  body_part_id?: string | number
  organ_name?: string
  label?: string
  name?: string
  value?: string
  categoryId?: string
  categoryLabel?: string
  description?: string
  order?: number
  is_active?: boolean
}

// ==================== Necropsy Organ ====================

export interface NecropsyOrgan {
  necropsy_organ_id?: number
  organ_id: number
  organ_name: string
  body_part_id?: number
  body_part_name?: string
  findings?: string
  is_normal?: boolean
  images?: NecropsyAttachment[]
  order?: number
}

// ==================== Timeline ====================

export interface NecropsyTimelineItem {
  timeline_id: number
  event_type?: string
  event_title?: string
  event_description?: string
  event_date?: string
  event_time?: string
  created_by?: string
  created_by_avatar?: string
  metadata?: Record<string, unknown>
  created_at?: string
}

// ==================== Medical History ====================

export interface MedicalRecord {
  medical_record_id: number
  medical_record_guid?: string
  record_type?: string
  record_date?: string
  chief_complaint?: string
  diagnosis?: string
  treatment?: string
  notes?: string
  created_by?: string
  created_at?: string
  attachments?: NecropsyAttachment[]
}

export interface MedicalBasicData {
  id?: number
  medical_record_code?: string
  status?: string
  case_type?: string
  type?: string
  created_at?: string
  diagnosis?: {
    name?: string
    diagnosis?: string
    status?: string
    clinical_assessment?: string
    additional_info?: {
      clinical_assessment?: string
    }
  }[]
  complaint?: {
    complaint?: string
    name?: string
    additional_info?: {
      status?: string
    }
  }[]
  prescription?: {
    id?: number
    name?: string
  }[]
  diagnosis_count?: string | number
  complaint_count?: string | number
  prescription_count?: string | number
  category?: string
  items?: MedicalBasicDataItem[]
}

export interface MedicalBasicDataItem {
  id: number
  name?: string
  value?: string
  unit?: string
  date?: string
  notes?: string
}

export interface ClinicalAssessment {
  assessment_id: number
  assessment_type?: string
  assessment_date?: string
  findings?: string
  recommendations?: string
  assessed_by?: string
  created_at?: string
}

export interface AssessmentType {
  type_id: number
  type_name: string
  description?: string
  icon?: string
}

export interface AssessmentData {
  assessment_id: number
  type_id?: number
  type_name?: string
  data?: Record<string, unknown>
  created_at?: string
}

export interface MedicalJournalEntry {
  type?: string
  category?: string
  title?: string
  time?: string
  code?: string
  details?: {
    medical_record_number?: string
    [key: string]: unknown
  }
  createdBy?: {
    name?: string
    timestamp?: string
  }
  created_by?: {
    name?: string
    timestamp?: string
  }
  user_full_name?: string
  incon?: string
}

export interface MedicalJournalLog {
  date?: string
  day?: string
  entries?: MedicalJournalEntry[]
}

// ==================== Diagnosis & Prescription ====================

export interface Diagnosis {
  diagnosis_id: number
  diagnosis_code?: string
  diagnosis_name?: string
  diagnosis_type?: string
  is_primary?: boolean
  notes?: string
  diagnosed_by?: string
  diagnosed_at?: string
}

export interface Prescription {
  prescription_id: number
  prescription_code?: string
  medication_name?: string
  dosage?: string
  dosage_unit?: string
  frequency?: string
  duration?: string
  route?: string
  instructions?: string
  prescribed_by?: string
  prescribed_at?: string
  start_date?: string
  end_date?: string
  status?: string
}

// ==================== Form Options ====================

export interface SelectOption {
  label: string
  value: string | number
  key?: string
}

export interface WeightUnitOption {
  id: number
  label: string
  value: string
  unit_name?: string
  uom_abbr?: string
}

export interface MeasurementUnit {
  id: number
  unit_name?: string
  uom_abbr?: string
  measurement_type?: string
}

// ==================== User Related ====================

export interface User {
  user_id: number
  user_guid?: string
  user_name?: string
  full_name?: string
  email?: string
  avatar?: string
  role?: string
}

export interface UserAvatarInfo {
  id: number
  name?: string
  avatar?: string
  role?: string
}
