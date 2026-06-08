/**
 * Anesthesia domain model types for the Hospital module.
 *
 * Extracted from the monolithic `src/types/hospital/models.ts`.
 * Covers the full anesthesia flow: detail record, setup, medications, gas,
 * vital monitoring, recovery/reversal, and supporting option/picker shapes.
 */

import type { Id, UserAvatarInfo } from '../models'

// ==================== Shared unions ====================

export type DeliveryStatus = 'Complete' | 'Partial' | 'None'

export type EstimatedUnit = 'hr' | 'min' | string

// ==================== Top-level anesthesia record ====================

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

export interface AnesthesiaRecordItem extends AnesthesiaDetails {
  procedures?: string[]
  createdOn?: string
  createdBy?: string
  time?: string
}

// ==================== Picker / option shapes ====================

export interface AnesthesiaDetailOption {
  label?: string
  value?: string | number | null
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

export interface MonitoringToggleItem {
  id: number
  name: string
}

// ==================== Setup / monitoring state ====================

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

export interface AnesthesiaSetupRow {
  key: string
  label?: string
  meta: AnesthesiaSetup
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

export interface AnesthesiaAssessmentType {
  id: Id
  type: string
  name: string
  is_other: number | string | boolean
  created_at: string
  is_selected: number | string | boolean
}

// ==================== Medication / gas / reversal rows ====================

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

// ==================== Doctor (anesthesia-focused) ====================

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

// ==================== Pre-anesthesia ====================

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

// ==================== Medications and gas (intra-op) ====================

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

// ==================== Vital monitoring ====================

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

// ==================== Recovery & reversal ====================

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
  describe_problem: string
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

// ==================== Attachments / delivery route ====================

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
