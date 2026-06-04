import { Id } from "src/types/compliance"
import { StatusAction } from "../../models"
import { PrescriptionRecord } from "../../models/prescription"

export type PrescriptionRecordResponse = | {
    success: true
    message: string
    data: PrescriptionRecord[]
} | {
    success: false
    message: string
}

export interface PrescriptionRecordParams {
    hospital_case_id: Id
    animal_id: Id
    status: StatusAction
    type: string
}