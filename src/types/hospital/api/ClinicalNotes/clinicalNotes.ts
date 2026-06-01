import { Id } from "../../models";
import { ClinicalNotesList } from "../../models/clinicalNotes";

export type GetClinicalNotesResponse =
  | {
      success?: true
      data: {
        total_count: number
        result: ClinicalNotesList[]
      }
      message: string
    }
  | {
      success?: false
      message: string
    }

export interface ClinicalNotesParams {
    type: string
    limit: number
    hospital_case_id: string
    medical_type: string
    page: number
}

export type DeleteClinicalNotesResponse = | {
  success: true
  message: string
} | {
  success: false
  message: string
}

export interface AddClinicalNotesParams {
  medical_record_id: string
  note: string
  hospital_case_id: string
}

export type AddClinicalNotesResponse = | {
  success: true
  data: {
    totalNotesName: string[]
  }
  message: string
} | {
  success: false
  message: string
}