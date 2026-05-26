import { Id, PrescriptionMedicationParams, VisitTypeReason } from "../../models"
import { PatientCategory } from "../Inpatient/inpatient"

export interface DischargeAnimalResponse {
    success: boolean
    data: {
        discharge_id: Id
    }
    message: string
}

export interface DischargeAnimalParams {
    hospital_case_id: Id
    animal_id: Id
    discharge_type: string
    discharge_date: string | null
    discharge_time: string | null
    reason: string | null 
    care_diet_instruction: string | null
    care_restriction: string | null
    care_notes: string | null
    follow_up_required: string | number | boolean
    follow_up_date: string | null
    attachments: File[] | null 
    medications: PrescriptionMedicationParams | string | null
    transfer_to_site_id: Id
    transfer_to_section_id: Id
    transfer_to_enclosure_id: Id
    request_from: string
    transfer_back_to_original_location: string | number
}

export interface DownloadDischargeParams {
    q: string
    hospital_id: Id
    patient_category: PatientCategory
    visit_type: VisitTypeReason
    export: boolean
}



