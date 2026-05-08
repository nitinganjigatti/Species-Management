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
  Symptom,
  Diagnosis,
  ClinicalNote,
  ClinicalAssessment,
  Medicine,
  PrescriptionMedicine,
  Prescription,
  TreatmentMonitoringEntry,
  SurgeryRecord,
  AnesthesiaRecord,
  Doctor,
  Staff,
  PatientMedia,
  SelectOption
} from './models'

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
  SymptomListResponse,
  ClinicalNoteListResponse,
  ClinicalAssessmentListParams,
  ClinicalAssessmentListResponse,
  DiagnosisListResponse,
  PrescriptionListParams,
  PrescriptionListResponse,
  MedicineListParams,
  MedicineListResponse,
  TreatmentMonitoringListParams,
  TreatmentMonitoringListResponse,
  SurgeryListParams,
  SurgeryListResponse,
  AnesthesiaListParams,
  AnesthesiaListResponse,
  DoctorListParams,
  DoctorListResponse,
  StaffListParams,
  StaffListResponse,
  PatientMediaListParams,
  PatientMediaListResponse,
  RoomsAndEnclosuresParams,
  RoomsAndEnclosuresResponse
} from './api'

// ==================== State ====================
export type { HospitalSliceState, UpdateStatePayload, HospitalContextValue } from './state'

// ==================== Components ====================
export type { BaseDrawerProps, BaseDrawerWithIdProps, BaseFilterDrawerProps } from './components'
