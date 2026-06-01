import { Id } from "src/types/compliance";
import { SurgeryMaster } from "../../models/surgeryMaster";
import { SurgeryRecords } from "../../models/surgery";

export interface GetPatientSurgeryListResponse {
    success: boolean
    data: {
        surgery_records: SurgeryRecords[]
        current_page: number | string | null
        per_page: number | string
        total_pages: number | string
        total_records: number | string
    }
    message: string
}

export interface GetPatientSurgeryListParams {
    hospital_case_id: Id
}

export interface GetSurgeryMasterResponse {
    success: boolean
    data: {
        surgeries: SurgeryMaster[]
        current_page: string | number
        per_page: string | number
        total_pages: string | number
        total_records: string | number
    }
    surgeries?: SurgeryMaster[]
    message: string
}

export interface GetSurgeryMasterParams {
    page_no: string | number
    limit: string | number
    q?: string
    hospital_id?: Id
    type?: string
    visit_type?: string
}

export interface AddSurgeryRecordResponse {
    success: boolean
    data: {
        surgery_record_id: Id
    }
    message: string
}

export interface AddSurgeryRecordParams {
    hospital_case_id: Id
    anaesthesia_id: Id
    surgery_date: string
    start_time: string
    end_time: string
    surgery_id: Id
    type_of_surgery: string
    surgical_approach: string
    name_of_surgeon_id: Id
    surgery_notes: string
    complications: string
    care_diet_instructions: string
    care_activity_restrictions: string
    additional_notes: string
    duration: string
    secondary_surgeon: string[] 
}

export interface DeleteSurgeryRecordResponse {
    success: boolean
    data: []
    message: string
}


