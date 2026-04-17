/**
 * API request/response types for the Hospital module.
 *
 * Specific endpoint types are added as APIs are converted in Phase 2.
 */

import {
  Hospital,
  HospitalRoom,
  HospitalBed,
  HospitalAnalytics,
  Patient,
  IncomingPatient,
  Symptom,
  Diagnosis,
  ClinicalNote,
  ClinicalAssessment,
  Medicine,
  Prescription,
  TreatmentMonitoringEntry,
  SurgeryRecord,
  AnesthesiaRecord,
  Doctor,
  Staff,
  PatientMedia
} from './models'

// ==================== Generic ====================

export interface ApiResponse<T = unknown> {
  success?: boolean
  status?: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedData<T> {
  result?: T[]
  list?: T[]
  total_count?: number
  page?: number
  limit?: number
  stats?: Record<string, number | string>
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface PaginationParams {
  page?: number
  page_no?: number
  limit?: number
  search?: string
  q?: string
}

// ==================== Hospital Master ====================

export interface HospitalListParams extends PaginationParams {
  has_permission?: number
}

export interface HospitalListResponse extends PaginatedResponse<Hospital> {}

export interface AddHospitalPayload {
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  [key: string]: unknown
}

// ==================== Hospital Rooms / Beds ====================

export interface RoomListParams extends PaginationParams {
  hospital_id?: string | number
}

export interface RoomListResponse extends PaginatedResponse<HospitalRoom> {}

export interface BedListParams extends PaginationParams {
  hospital_id?: string | number
  room_id?: string | number
}

export interface BedListResponse extends PaginatedResponse<HospitalBed> {}

// ==================== Analytics ====================

export interface HospitalAnalyticsParams {
  hospital_id?: string | number
  date_from?: string
  date_to?: string
}

export interface HospitalAnalyticsResponse extends ApiResponse<HospitalAnalytics> {}

// ==================== Incoming Patients ====================

export interface IncomingPatientsParams extends PaginationParams {
  hospital_id?: string | number
  entity_type?: string
  [key: string]: unknown
}

export interface IncomingPatientsResponse extends PaginatedResponse<IncomingPatient> {}

export interface PatientDetailsResponse extends ApiResponse<Patient> {}

export interface AdmitPatientPayload extends FormData {}

// ==================== Inpatient ====================

export interface InpatientListParams extends PaginationParams {
  hospital_id?: string | number
  status?: string
}

export interface InpatientListResponse extends PaginatedResponse<Patient> {}

// ==================== Discharge ====================

export interface DischargePayload {
  patient_id: string | number
  discharge_type?: string
  destination?: string
  notes?: string
  [key: string]: unknown
}

// ==================== Symptoms ====================

export interface SymptomListParams extends PaginationParams {
  patient_id?: string | number
}

export interface SymptomListResponse extends PaginatedResponse<Symptom> {}

// ==================== Clinical ====================

export interface ClinicalNoteListResponse extends PaginatedResponse<ClinicalNote> {}

export interface ClinicalAssessmentListParams extends PaginationParams {
  patient_id?: string | number
  assessment_type?: string
}

export interface ClinicalAssessmentListResponse extends PaginatedResponse<ClinicalAssessment> {}

// ==================== Diagnosis ====================

export interface DiagnosisListResponse extends PaginatedResponse<Diagnosis> {}

// ==================== Prescription ====================

export interface PrescriptionListParams extends PaginationParams {
  patient_id?: string | number
  status?: string
}

export interface PrescriptionListResponse extends PaginatedResponse<Prescription> {}

export interface MedicineListParams extends PaginationParams {}

export interface MedicineListResponse extends PaginatedResponse<Medicine> {}

// ==================== Treatment Monitoring ====================

export interface TreatmentMonitoringListParams extends PaginationParams {
  patient_id?: string | number
  parameter_id?: string | number
}

export interface TreatmentMonitoringListResponse extends PaginatedResponse<TreatmentMonitoringEntry> {}

// ==================== Surgery / Anesthesia ====================

export interface SurgeryListParams extends PaginationParams {
  patient_id?: string | number
}

export interface SurgeryListResponse extends PaginatedResponse<SurgeryRecord> {}

export interface AnesthesiaListParams extends PaginationParams {
  patient_id?: string | number
}

export interface AnesthesiaListResponse extends PaginatedResponse<AnesthesiaRecord> {}

// ==================== Doctors & Staff ====================

export interface DoctorListParams extends PaginationParams {
  hospital_id?: string | number
}

export interface DoctorListResponse extends PaginatedResponse<Doctor> {}

export interface StaffListParams extends PaginationParams {
  hospital_id?: string | number
  role?: string
}

export interface StaffListResponse extends PaginatedResponse<Staff> {}

// ==================== Patient Media ====================

export interface PatientMediaListParams extends PaginationParams {
  patient_id?: string | number
}

export interface PatientMediaListResponse extends PaginatedResponse<PatientMedia> {}

// ==================== Rooms & Enclosures (cross-housing) ====================

export interface RoomsAndEnclosuresParams extends PaginationParams {
  hospital_id?: string | number
}

export interface RoomsAndEnclosuresResponse extends ApiResponse<unknown> {}
