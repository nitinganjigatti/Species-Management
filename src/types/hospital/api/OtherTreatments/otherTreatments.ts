import { GridSortModel } from '@mui/x-data-grid'
import { Id, OtherTreatment, OtherTreatmentRecord, TreatmentMaster } from '../../models'

export interface GetOtherTreatmentsParams {
  hospital_case_id: string
  medical_record_id: string
  page: number
  limit: number
  q: string
}

export type GetOtherTreatmentsResponse =
  | {
      success: true
      data: {
        total: number
        records: OtherTreatmentRecord[]
        page: number
        limit: number
        total_pages: number
      }
      message: string
    }
  | {
      success: false
      message: string
    }

export interface GetTreatmentMasterListParams {
  q: string
  page: number
  limit: number
}



export type GetTreatmentMasterListResponse =
  | {
      success: true
      data: {
        total: number
        records: TreatmentMaster[]
        page: string
        limit: number
        total_pages: number
      }
      message: string
    }
  | {
      success: false
      data: {
        records: []
      }
      message: string
    }

export interface UpdateTreatmentParams {
  animal_id: string
  medical_record_id: string
  hospital_case_id: string
  start_time: string
  treatment_master_id: string
  note: string
  treatment_id: string
}

export interface UpdateTreatmentResponse {
  success: boolean
  data: []
  message: string
}

export interface AddTreatmentParams {
  animal_id: string
  medical_record_id: string
  hospital_case_id: string
  start_time: string
  treatment_master_id: string
  note?: string
  is_edit: number
}


export interface AddTreatmentResponse {
  success: boolean
  data: []
  message: string
}

export interface DeleteTreatmentParans {
  treatment_id: string
}

export type DeleteTreatmentResponse = | {
  success: true
  data: []
  message: string
} | {
  success: false
  data: []
  message: string
}

export type GetTreatmentListResponse = | {
  success: true
  data: {
    total: number
    records: OtherTreatmentRecord[]
    page: number
    limit: number
    total_pages: number
  }
  message: string
} | {
  success: false
  message: string
}

export interface GetTreatmentListParams {
  animal_id: number
  medical_record_id: string
  hospital_case_id: string
  treatment_master_id?: string
}