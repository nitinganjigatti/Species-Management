import { Id, MedicalType } from "../../models";

import { Category, ComplaintsDiagnosisTemplates, Template   } from "../../models/templates";
import { CheckAnimalStatusByType, GetSymptomClinicalTabList, UpdateSymptomsCard  } from "../../models/symptoms";


export interface CategoryPayload {
    type?: MedicalType
    q?: string
}

export interface CategoryResponse {
    success: boolean 
    data: Category[]
    message?: string
}

export interface AddCategoryResponse {
    success: boolean
    data: number
    message?: string
}

export interface AddCategoryPayload {
    id: Id
    label: string
    type: MedicalType
}


export type GetTemplateResponse =
    | { success: true; data: {
        diagnosisTemplates: ComplaintsDiagnosisTemplates
        complaintsTemplates: ComplaintsDiagnosisTemplates
        adviceTemplates?: unknown[]
        assessmentTemplates?: unknown[]
      }; message: string }
    | { success: false; message: string }

export interface GetTemplatePayload {
    type: string
}


export type CreateUpdateTemplateResponse =
    | { success: true; data: Template[]; message?: string }
    | { success: false; message: string }

export interface CreateUpdateTemplatePayload {
    template_name: string
    type: MedicalType
    template_items: Id[]
}

export type UpdateNotesResponse =
    | { success: true; data: UpdateSymptomsCard; message?: string }
    | { success: false; message: string }

export interface UpdateNotesPayload {
    hospital_case_id: Id
    main_id: Id
    med_id: Id
    note: string
    note_id: Id
    type: MedicalType
}

export interface DeleteNotesResponse {
    success: boolean
    message: string
}

export interface DeleteNotesPayload {
    entity: MedicalType
    medical_id: Id
    record_id: Id
}

export type GetSymptomClinicalTabResponse =
  | { success: true; data: { totalRecords: string; result: GetSymptomClinicalTabList[] }; message?: string }
  | { success: false; message: string }

export interface GetSymptomClinicalTabPayload {
    include_all: number 
    type: MedicalType
    medical_record_id: Id
    request_from: string
}

export interface CheckAnimalStatusByTypeResponse {
    success: boolean
    data?: CheckAnimalStatusByType[]
    message: string
}

export interface CheckAnimalStatusByTypePayload {
    type: MedicalType
    animal_ids: string
    master_ids: string
}
