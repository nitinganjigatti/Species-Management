/**
 * API request/response types for the Hospital module.
 *
 * Specific endpoint types are added as APIs are converted in Phase 2.
 */

import { HospitalTransferRow } from '../housing/hospitalTransfer'
import {
  Hospital,
  HospitalBed,
  HospitalAnalytics,
  Patient,
  PatientDetailsData,
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
  PatientMedia,
  SiteLists,
  Id,
  HospitalStaff,
  StatusAction,
} from './models'

// ==================== Generic ====================

export interface ApiResponse<T = unknown> {
  success?: boolean
  status?: boolean
  message?: string
  data?: T
  error?: string
}

export type ApiError = {
  message?: string
  response?: {
    data?: {
      message?: string
    }
  }
}


export type DateType = string | null | Date

export type Availability = 'Available' | 'Occupied'

export interface AppliedFilters {
  Availability?: Availability[]
  Status?: StatusAction[]
  [key: string]: Availability[] | StatusAction[] | undefined
}

export interface Filters {
  page: number
  limit: number
  q: string
}


export type RouterQuery = {
  page?: string
  limit?: string
  q?: string
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

export interface SelectOption {
  value?: string | number
  label?: string
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
export interface GetSiteListsResponse {
  success: boolean
  message?: string
  data: {
    result: SiteLists[]
  }
}

// ==================== Hospital Rooms / Beds ====================

export interface BedListParams extends PaginationParams {
  hospital_id: string | number
  room_id: string | number
}

export interface BedListResponse extends PaginatedResponse<HospitalBed> {}

export interface AddBedPayload {
  id?: Id
  hospital_id?: Id
  room_id?: Id
  bed_name?: string
  status?: number | string
  prefix?: string | string[]
}

export interface UpdateBedPayload extends AddBedPayload {
  bed_id?: string
}

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

// export interface IncomingPatientsResponse extends PaginatedResponse<IncomingPatient> {}

export interface PatientDetailsResponse extends ApiResponse<PatientDetailsData> {}

export type PatientStatus = 'pending' | 'rejected'

export type PatientAdmitAction = 'admit' | 'reject'

export type TreatmentType = 'opd' | 'inpatient'

export type HealthStatus = 'stable' | 'critical'

export type TreatmentTypeOption = {
  label?: string
  value?: 'opd' | 'inpatient'
}

export type HealthStatusOption = {
  label?: string
  value?: 'stable' | 'critical'
}

export type SelectAdmitOption = {
  bed_name?: string
  id?: Id
  room_id?: Id
  room_name?: string
}

export interface RoomEnclosureResponse {
  success?: boolean
  data?: {
    total?: number
    records?: HospitalBed[]
  }
}

export interface SelectDoctorOption {
  value?: string | number
  label?: string
  id?: Id
  user_full_name?: string
  user_id?: Id
  user_profile_pic?: string
  role_name?: string
  name?: string
  default_icon?: string
}
export interface RoomEnclosureParams {
  hospital_id?: Id
  page?: number
  per_page?: number
  q?: string
  status?: StatusAction,
  room_id?: Id
}


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

export type AddRemoveDoctorAction = 'add' | 'delete'

export interface StaffListResponse extends PaginatedResponse<Staff> {}

export interface HospitalStaffListParams {
  q?: string
  page_no?: number | string
  limit?: number | string
  hospital_id?: Id
  is_hospital_chief_doctor?: string
}

export interface HospitalStaffListResponse {
  success?: boolean
  data: {
    total?: number
    records?: HospitalStaff[]
    current_page?: number
    per_page?: number
    total_pages?: number
  }
  message?: string
}

export interface AddRemoveChiefDoctorResponse {
  success?: boolean
  data?: unknown[]
  message?: string
}

export interface AddRemoveChiefDoctorPayload {
  action?: AddRemoveDoctorAction
  hospital_id?: Id
  hospital_chief_doctor?: Id
}


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

export interface UpdateDeleteApiResponse {
  success: boolean
  message: string
}

export interface DeleteApiResponse {
  success: boolean
  data: unknown[]
  message: string
}