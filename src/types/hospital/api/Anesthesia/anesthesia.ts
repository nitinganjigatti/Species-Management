import { Id } from "src/types/compliance"
import { AnesthesiaAssessmentType, AnesthesiaDetails, AnesthesiaSetup, DeliveryRoute, DeliveryStatus, EstimatedUnit, VitalMonitoring } from "../../models/anesthesia"
import { Dayjs } from "dayjs"
import { Day } from "date-fns"

export interface AnesthesiaRecordsResponse {
    success: boolean
    data: {
        total: number
        records: AnesthesiaDetails[]
        page_no: string | number
        per_page: string | number
        total_pages: string | number
    }
    message: string
}

export interface AnesthesiaRecordsParams {
    hospital_case_id: Id
    medical_record_id: Id
    limit: string | number
    page_no: string | number
}

export interface AnesthesiaPurpose {
    selected: string[]
    custom: string[]
}

export interface AddAnesthesiaParams {
    anaesthesia_id: Id
    hospital_case_id: Id
    medical_record_id: Id
    location: string
    anaesthesia_datetime: string
    estimated_time_required: string
    estimated_time_unit: EstimatedUnit
    veterinarian_id: Id[]
    anesthesist_id: Id[]
    notes: string
    purpose: AnesthesiaPurpose
}

export interface AddAnesthesiaResponse {
    status: boolean
    message: string
    data: {
        anaesthesia_id: Id
        anaesthesia_code: string
        code?: string
        id?: Id
        anaesthesia_detail: AnesthesiaDetails
    }
    success?: boolean
    anaesthesia_id?: Id
    anesthesia_id?: Id
    anaesthesia_code?: string
    anesthesia_code?: string
    code?: string
}

export interface AnesthesiaSetupParams {
    type: string
}

export interface AnesthesiaSetUpListResponse {
    success: boolean
    message: string
    data: {
        total: string | number
        page_no: string | number
        per_page: string | number
        total_pages: string | number
        result: AnesthesiaSetup[]
    }
}

export interface AnesthesiaAssessmentTypeParams {
    type: string
}


export interface AnesthesiaAssessmentTypeResponse {
    success: boolean
    data: {
        total: string | number
        records: AnesthesiaAssessmentType[]
        page_no: string | number
        per_page: string | number
        total_pages: string | number
    }
    message: string
}

export interface DeliveryRouteResponse {
    success: boolean
    data: DeliveryRoute[]
    message: string
}

export interface VitalMonitoringResponse {
    success: boolean
    message: string
    data: {
        total: string | number
        page_no: string | number
        per_page: string | number
        total_pages: string | number
        result: VitalMonitoring[]
        time_slots: string[] | []
    }
}

export interface VitalMonitoringParams {
    type: string
}

export interface GetAnesthesiaDetailResponse {
    success: boolean
    data: {
        total: number | string
        records: AnesthesiaDetails[]
        page_no: string | number
        per_page: string | number
        total_pages: string | number
    }
    message: string
}

export interface GetAnesthesiaDetailParams {
    hospital_case_id: Id
    medical_record_id: Id
    limit: string | number
    page_no: string | number
}

export interface DeleteAnesthesiaResponse {
    success: boolean
    message: string
    status?: boolean
    anaesthesia_id?: Id
    anesthesia_id?: Id
    reason?: string
    data: {
        anaesthesist_id: Id
        anaesthesist_code: string
        message?: string
    }
}

export interface UpdateMedicationParams {
    id: Id
    drug_id: Id
    purpose_stage?: string
    amount?: string | number
    unit_id?: Id
    route: string
    delivery_time?: string | Dayjs
    delivery_status: DeliveryStatus
    max_effect?: string | Dayjs
    comments?: string
    type: string
    anaesthesia_id: Id
    oxygen_l_min?: string | number
    concentration?: string | number
    start_time?: string
    end_time?: string

}

export interface DeleteAnesthesiaMedicationParams {
    id: Id
    type: string
}

export interface DeleteVitalMonitoringParams {
    record_time_id: Id
}

export interface AnesthesiaDetailResponse {
    success: boolean
    data: AnesthesiaDetails
    message: string
}