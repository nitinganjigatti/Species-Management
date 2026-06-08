import { GridSortModel } from "@mui/x-data-grid"
import { FilterDate, Id, Patient, PatientData, VisitTypeReason } from "../../models"
import { AddPatient, RefIds } from "../../models/inpatient"
import { HealthStatusOption } from "../../api"
import { SelectOption } from "src/types/necropsy"

export type PatientCategory = 'inpatient' | 'discharge' | 'outpatient'

export interface PatientDetailFilters {
    page: number
    limit: number
}

export interface GetPatientListResponse {
    success: boolean
    data: {
        total?: number
        records: PatientData[]       
        page_no?: number
        limit: number
        total_page: number
    }
    message?: string
}

export interface GetInpatientListParams {
    page_no: number
    limit: number
    total_page?: number
    q: string
    hospital_id: Id
    visit_type: VisitTypeReason
    patient_category: PatientCategory
    from_date: string
    to_date: string
    users: string
    origin_site: string
    sort?: string
    discharge_treatment_type?: string
}

export interface GetInpatientListFilters {
  page: number
  limit: number
  q: string
}

export interface AddPateintResponse {
    success: boolean
    data: AddPatient[]
    message: string
}

export interface AddPatientParams {
  source_id: number | string
  source_site_id: number | string | null
  destination_site_id: number | string
  usecase: string
  source_type: string
  destination_id: Id | string
  destination_type: string
  transfer_type: string
  reason_for_transfer: string
  ref_ids: string
  transfer_entity_type: string
  entitiy_item_type: string
  request_from: string
  module: string
  visit_type: VisitTypeReason
  additional_info: AddPatientAdditionalInfo | string
  co_attend_doctor: SelectOption | string
}

export interface AddPatientAdditionalInfo {
  treatment_type: string
  health_status: HealthStatusOption
  doctor_id: Id
  holding_enclosure_id: Id
  room_id: Id
  admit_date: string
  admit_time: string
}