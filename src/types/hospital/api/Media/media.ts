import { Id } from "src/types/compliance"
import { PatientMediaData, PatientMediaNotes } from "../../models"

export interface PatientMediaResponse {
    success: boolean
    data: {
        result: PatientMediaData[]
        total_count: number | string
    }
    message: string
}

export interface PatientMediaParams {
    current_medical_record_id: Id
    file_type: string
    module: string
    page: string | number
    limit: string | number
    animal_id: Id
    q: string
}

export interface UploadPatientMediaResponse {
    success: boolean
    data: {
        notes: PatientMediaNotes[]
        images: PatientMediaData[]
        videos: unknown[]
        documents: PatientMediaData[]
    }
    message: string
}

export interface UploadPatientMediaParams {
    note_files: File[]
    medical_record_id: Id

}