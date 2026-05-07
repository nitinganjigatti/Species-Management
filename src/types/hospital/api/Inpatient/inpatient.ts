import { GridSortModel } from "@mui/x-data-grid"
import { FilterDate, Id, Patient, PatientData, VisitTypeReason } from "../../models"

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