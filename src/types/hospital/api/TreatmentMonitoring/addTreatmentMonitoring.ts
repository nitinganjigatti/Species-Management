export interface AddTreatmentMonitoringResponse {
    success: boolean
    data: number
    item: number
    message: string
}

export interface AddTreatmentMonitoringParams {
    assessment_type_id: string
    assessment_unit_id: string | null
    assessment_value: string
    comments: string
    hospital_case_id: string
    medical_record_id: string
    recorded_date_time: string
}