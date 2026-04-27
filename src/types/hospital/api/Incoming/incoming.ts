import { Id, PurposeOfVisit, Incoming } from "../../models"
import { HospitalTransferRow } from "src/types/housing/hospitalTransfer"

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
}

export interface GetIncomingPatientParam {
  page_no?: number
  limit?: number
  q?: string
  request_from?: string
  reference_type?: string
  hospital_id?: Id
  hospital_status_filter?: PatientStatus
  visit_type?: PurposeOfVisit
  patient_category?: string
  users?: string
  from_date?: string | null
  to_date?: string | null
  origin_site?: string
  entity_id?: string | string[]
  entity_type?: string
  transfer_status?: string
}

export interface GetIncomingPatientResponse extends HospitalTransferRow {
  success?: boolean
  data?: {
    total_count?: number
    result? : Incoming[] | HospitalTransferRow[]
    stats?: {
      transfer_pending_count?: number
      transfer_rejected_count?: number
      pending_count?: string
      completed_count?: string
      canceled_count?: string
      rejected_count?: string
  }
  }
  message?: string
}

export interface IncomingFilters {
  page: number
  limit: number
  q?: string
}

