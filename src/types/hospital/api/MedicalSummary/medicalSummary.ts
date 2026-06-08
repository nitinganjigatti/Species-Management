import { Id } from "src/types/compliance"
import { MedicalSummary } from "../../models/medicalSummary"

export interface GetMedicalSummaryResponse {
    success: boolean
    data: MedicalSummary[]
    message: string
}

export interface GetMedicalSummaryParams {
    page: string | number
    limit: string | number
    q: string
    module_filter?: string
    animal_id: Id 
}