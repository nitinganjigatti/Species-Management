/**
 * Hospital Module Types
 *
 * Public barrel export for all hospital-module TypeScript types.
 * Import from 'src/types/hospital'.
 */

// ==================== Models ====================
export type {
  Id,
  UserAvatarInfo,
  Hospital,
  HospitalRoom,
  HospitalBed,
  HospitalAnalytics,
  PatientStatus,
  Patient,
  // IncomingPatient,
  Doctor,
  Staff,
  SelectOption
} from './models'
export type { Medicine, PrescriptionMedicine, Prescription } from './models/prescription'
export type { TreatmentMonitoringEntry } from './models/treatmentMonitoring'
export type { SurgeryRecord } from './models/surgery'
export type { AnesthesiaRecord } from './models/anesthesia'
export type { PatientMedia } from './models/media'

// ==================== API ====================
export type {
  ApiResponse,
  PaginatedData,
  PaginatedResponse,
  PaginationParams,
  HospitalListParams,
  HospitalListResponse,
  AddHospitalPayload,
  BedListParams,
  BedListResponse,
  HospitalAnalyticsParams,
  HospitalAnalyticsResponse,
  IncomingPatientsParams,
  // IncomingPatientsResponse,
  PatientDetailsResponse,
  InpatientListParams,
  InpatientListResponse,
  DischargePayload,
  SymptomListParams,
  ClinicalAssessmentListParams,
  PrescriptionListParams,
  MedicineListParams,
  TreatmentMonitoringListParams,
  SurgeryListParams,
  AnesthesiaListParams,
  DoctorListParams,
  DoctorListResponse,
  StaffListParams,
  StaffListResponse,
  PatientMediaListParams,
  RoomsAndEnclosuresParams,
  RoomsAndEnclosuresResponse
} from './api'

// ==================== State ====================
export type { HospitalSliceState, UpdateStatePayload, HospitalContextValue } from './state'

// ==================== Components ====================
export type { BaseDrawerProps, BaseDrawerWithIdProps, BaseFilterDrawerProps } from './components'
