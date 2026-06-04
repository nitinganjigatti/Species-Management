import { Id, MedicalType, Severity, SymptomStatus, EntityType, DurationUnit } from "../../models"

import { AddSymptomsCard, Complaints, SymptomList, SymptomRecords, SymptomsListForAdding, UpdateSymptomsCard  } from "../../models/symptoms"

export interface GetSymptomsCardResponse {
    success?: boolean
    data: {
        closed: number
        active: number
        all: number
        total_count: number
        result: SymptomList[]
    }
    message?: string
}

export interface GetSymptomsCardParams {
    type?: SymptomStatus
    page_no?: string | number
    limit?: string | number
    medical_type?: MedicalType
    q: string
    hospital_case_id: string 
    medical_record_id?: Id
}

export interface AddSymptomsCardResponse {
    success?: boolean
    data?: AddSymptomsCard[]
    message?: string
}

export interface AddSymptomsCardParams {
    medical_record_id?: Id
    animal_id?: Id[]
    hospital_case_id?: Id
    complaints?: Complaints[]
}

export interface GetSymptomsListForAddingResponse {
    success: boolean
    data: {
        totalRecords: number
        result: SymptomsListForAdding[]
        selected_ids: Id[]
        currentPage?: number
        totalPages?: number
    }
}

export interface GetSymptomsListForAddingParams {
    page_no: number | string
    type: MedicalType
    q: string
    category_id: Id
    request_from: string
    animal_id: Id
    limit: number
}

export interface GetSymptomRecordResponse {
    success?: boolean
    data: SymptomRecords
    message?: string
}

export interface GetSymptomRecordPayload {
    entity?: EntityType
    medical_id?: Id
    record_id?: Id
}

export interface AddSymptomsResponse {
    success: boolean
    data?: Id
    message?: string
}

export interface AddSymptomsPayload {
    label: string
    category_id: Id
}

export interface UpdateSymptomsCardPayload {
    main_id: Id
    med_id: Id
    animal_id: Id
    type: MedicalType
    is_system_generated: number
    severity: Severity
    duration: number | string
    duration_unit: DurationUnit
    status: SymptomStatus
    hospital_case_id: Id
    recorded_date_time: string | number
    note: string

}

export interface UpdateSymptomsCardResponse {
    success?: boolean
    data: UpdateSymptomsCard
    message?: string
}

export interface DeleteSymptomNotesResponse {
    success: boolean
    message?: string
}

