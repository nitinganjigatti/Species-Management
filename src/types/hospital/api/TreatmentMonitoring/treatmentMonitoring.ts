import { Id } from "../../models"
import { PreviousAssessmentEntry, TemplateAssessmentTypes, TreatmentMonitoringData, ParametersBasedOnFilters, HospitalParamsFilterOption } from "../../models/treatmentMonitoring"
import { Dayjs } from "dayjs"

export interface GetTreatmentMonitoringListResponse {
    status: boolean
    data: TreatmentMonitoringData[]
    header_date: {
        start_date: string
        end_date: string
        discharge_at: string | null
        between_date: string[]
    }
    is_scheduled_for_particular_day: string
    initial_scheduled_date: string
    current_day_schedule_date_time: string
    show_edit_schedule_button: number | string
    message: string 
}

export interface GetTreatmentMonitoringListParams {
    date: string
    hospital_case_id: string
}

export interface PreviousEntryResponse {
    status: boolean
    data: PreviousAssessmentEntry[]
    message: string
}

export interface PreviousEntryParams {
    date: string
    hospital_case_id: string
    assessment_type_id: string
}

export interface UpdatePreviousEntryParams {
    animal_assessment_id: Id
    assessment_type_id: Id
    assessment_value: string
    assessment_unit_id: Id | null
    comments: string
    recorded_date_time: string | Dayjs
}

export interface UpdatePreviousEntryResponse {
    success: boolean
    data: unknown[]
    message: string
}

export interface DeletePreviousEntryResponse {
    status: boolean
    data: unknown[]
    message: string
}

export interface GetParametersBasedOnFiltersParams {
    ref_type: string
    page_no?: string | number
    limit?: number | string
    q?: string
    cat_id: Id
}

export interface GetParametersBasedOnFiltersResponse {
  success: boolean
  data: { 
    result: ParametersBasedOnFilters[] 
    total_count: string | number
  }
  message: string
}

export interface GetTreatmentMonitoringCategoryTypeResponse {
    success: boolean
    data: {
        total_count: string | number
        result: TemplateAssessmentTypes[]
    }
    message: string
}

export interface GetHospitalParamsFilterOptionsPayload {
    ref_type: string
}

export interface GetHospitalParamsFilterOptionsResponse {
    success: boolean
    data: HospitalParamsFilterOption[]
    message: string
}

