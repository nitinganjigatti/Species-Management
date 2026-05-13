import { Files, HospitalVisitSummary, Id } from "../../models"

export interface GetPatientMediaResponse {
    success?: boolean
    data: {
        media: {
            files: Files[]
        }
    }
}

export interface GetHospitalVisitSummaryResponse {
    success?: boolean
    data: {
        download_url?: string
        download_file_url?: string
    }
    message?: string
}

export interface GetHospitalVisitSummaryPayload {
    sections?: string 
    animal_id?: Id
    hospital_case_id?: Id
}

export interface GetDischargeSummaryResponse {
    success?: boolean
    data: {
        download_url?: string
    }
    message?: string
}

export interface GetDischargeSummaryPayload {
    hospital_case_id?: Id
}

