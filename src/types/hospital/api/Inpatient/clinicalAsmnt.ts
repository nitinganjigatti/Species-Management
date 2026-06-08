import { Id, MedicalType, SymptomStatus } from "src/types/hospital/models";
import { ClinicalAsmntType, ClinicalAssessmentCardList, ClinicalAssessmentList, ClinicalRecords, MedicalStatus, Prognosis, UpdateClinicalAssmntCard } from "src/types/hospital/models/clinicalAssessment";

export type GetClinicalAssessmentCardResponse =
  | {
      success: true
      data: {
        closed: string         
        active: string
        all: string
        total_count: string  
        totalMedicalRecordCount: string 
        result: ClinicalAssessmentCardList[]
      }
      message?: string
    }
  | {
      success: false
      message: string
    }

export interface GetClinicalAssessmentCardParams { 
    medical_type: MedicalType
    page_no: number
    limit: number
    animal_id: Id
    type: SymptomStatus
    q: string
    hospital_case_id: Id
    medical_record_id: Id
}

export type GetClinicalAssmntRecordResponse =
  | {
      success: true
      data: ClinicalRecords
      message: string
    }
  | {
      success: false
      message: string
    }

export interface GetClinicalAssmntRecordParams {
    entity: MedicalType
    medical_id: Id
    record_id: Id
}

export type UpdateClinicalAssmntResponse =
  | {
      success: true
      data: UpdateClinicalAssmntCard
      message?: string
    }
  | {
      success: false
      message: string
    }

export interface UpdateClinicalAssmntParams {
    animal_id: Id
    chronic?: number
    clinical_assessment?: ClinicalAsmntType
    hospital_case_id: Id
    is_system_generated: boolean
    main_id: Id
    med_id: Id
    note?: string
    prognosis?: Prognosis
    recorded_date_time: string
    type: MedicalType
    status?: MedicalStatus
}

export type GetClinicalAssessmentListResponse =
  | {
      success: true
      data: {
        totalRecords: number
        result: ClinicalAssessmentList[]
        selected_ids: string[]
      }
      message?: string
    }
  | {
      success: false
      message?: string
    }
    
export interface GetClinicalAssessmentListParams {
  page_no: string | number
  limit: number
  q: string
  category_id: Id
  type: MedicalType
  animal_id: Id
}