import { AddIntervalParameter, HospitalParametersUnit, IntervalAssessmentList, MeasurementUnitDropdown, MonitoringParameters, ParameterDropdownValue, RemoveParameterPeriod, SaveTemplate, TemplateAssessmentTypes, TemplatesAssessmentList } from "../../models"

export interface MonitoringParametersPayload {
    monitoring_date?: string
}

export interface MonitoringParametersResponse {
    status: boolean
    data: {
        assessments: MonitoringParameters[]
    }
    message: string
}

export interface DeleteMonitoringParameterPayload{
    hospital_case_id: string
    assessment_type_id: string
    scheduled_date_time: string
    remove_parameter_period?: RemoveParameterPeriod
}

export interface DeleteMonitoringParameterResponse {
    status: boolean
    data: []
    message: string
}

export interface AddIntervalForParametersResponse {
    status: string
    monitoring_id: string
    message: string
}

export interface AddIntervalForParameterPayload {
    is_schedule_for_today: string | boolean
    parameters: AddIntervalParameter[]
    start_date: string
    start_time: string
    hospital_case_id: string
}

export interface GetTreatmentIntervalsResponse {
    status: boolean
    data: IntervalAssessmentList[]
    message: string
}

export interface GetTemplatesParamsListPayload {
    ref_type: string
    hospital_id: string
}

export interface GetTemplatesParamsListResponse {
  success: boolean
  data: {
    total_count: string
    result: TemplatesAssessmentList[]
  }
  message: string
}

export interface TemplateAssessmentCategory {
    assessment_category_id: string
    assessment_category_label?: string
    assessment_types: TemplateAssessmentTypes[]
}

export interface GetParamsBasedOnTemplatesResponse {
    status: boolean
    data: {
        assessment_category: TemplateAssessmentCategory[]
    }
    message: string
}

export interface GetParamsBasedOnTemplatesPayload {
    assessment_template_id: string
}

export type SaveTemplatePayload = {
    template_name: string
    hospital_id: string | number
    description: string
} & {
    [key: `type_ids[${number}]`]: string | number
}

export interface SaveTemplateResponse {
  status: boolean
  data: SaveTemplate
  message: string
}

export type AddMonitoringParameterPayload = {
    hospital_case_id: string
    parameter_date: string
    today_only: string
} & {
    [key: `assessment_ids[${number}]`]: string | number
}

export interface AddMonitoringParameterResponse {
    status: boolean
    data: unknown[]
    message: string
}

export interface GetHospitalParametersUnitResponse {
    status: boolean
    data: HospitalParametersUnit[]
    message: string
}




