import { string } from 'yup'
import {
  Id,
  MedicalType,
  MedicineSideEffect,
  PrescriptionList,
  PrescriptionStatus,
  PrescriptionFrequencyList,
  PrescriptionIntervalList,
  PrescriptionMasterData,
  AddPrescriptionParamList,
  AddPrescriptionResponseList,
  RestartStopMedicineItem,
  AnimalCategory,
  PrescriptionScheduleStatus,
  PrescriptionDates,
  DosePurpose,
  AdministerDoseBatchDetails,
  ApplyDosage,
  AddDosageScheduleInfo,
  DirectAdministerScheduleDose,
  RestartMedicineDetails
} from '../../models'
import { Animal } from 'src/types/housing'

export interface GetPrescriptionListParams {
  hospital_id: Id
  animal_id: Id
  medical_type: MedicalType
  type: PrescriptionStatus
  generate_for_date: string
  medical_record_id?: Id
  hospital_case_id: Id
}

export type GetPrescriptionListResponse =
  | {
      success: true
      data: {
        schedulded_date: string[]
        time_slots: string[]
        prescriptions: PrescriptionList[]
      }
      message: string
    }
  | {
      success: false
      message: string
    }

export interface GetPrescriptionMedicineSideEffectParams {
  animal_id: string
}

export type GetPrescriptionMedicineSideEffectResponse =
  | {
      success: true
      data: {
        result: MedicineSideEffect[]
        total_count: number
      }
      message?: string
    }
  | {
      success: false
      data?: {
        result: []
        total_count: number
      }
      message: string
    }

export type GetMedicalMasterDataResponse =
  | {
      success: true
      data: PrescriptionMasterData
      message?: string
    }
  | {
      success: false
      message: string
    }

export type GetPrescriptionFrequencyResponse = 
  | {
    success: true
    data: PrescriptionFrequencyList[]
    message: string
    
  } | {
    success: false
    message: string
  }


export type GetIntervalListResponse =
  | {
    success: true
    data: PrescriptionIntervalList[]
    message: string
  }
  | {
    success: false
    message: string
  }

export interface AddPrescriptionParams {
  medical_record_id: Id
  request_from: string
  hospital_case_id: Id
  data: AddPrescriptionParamList | string
}


export type AddPrescriptionResponse =
  | {
      success: true
      data: AddPrescriptionResponseList[]
      message: string
    }
  | {
      success: false
      message: string
    }

export type UpdatePrescriptionResponse =
  | { success: true; data: unknown[]; message: string }
  | {
      success: false
      message: string
    }


export interface UpdatePrescriptionParams {
  medical_record_id: Id
  prescription_id: Id
  medicine_id: Id
}

export type AddDirectAdministerResponse = 
| {
  success: true
  data: Id
  message: string
} | {
  success: false
  message: string
}

export interface AddDirectAdministerParams {
  record_date: string
  case_type: string | number
  animal_id: Id
  created_for: string
  note: string
  medical_record_type: AnimalCategory
  request_from: string
  medical_record_id: Id
  hospital_case_id: string
  prescription: AddPrescriptionParamList[] | string
}

export type RestartStopMedicineResponse =
  | {
      success: true
      data: RestartStopMedicineItem[]
      message: string
    }
  | {
      success: false
      message: string
    }

export interface StopMedicineParams {
  case: AnimalCategory
  main_prescription_id: Id
  medical_record_id: Id
  prescription_id: Id
  request_from: string
  side_effect: boolean
  status: PrescriptionStatus
  stop_date?: string | null
  type: string
  note: string

}

export interface RestartMedicineParams {
  medicine_details: RestartMedicineDetails
  medical_record_id: Id
  note: string
  prescription_id: Id
  request_from: string
  status: PrescriptionStatus
  type: string
}

export type UndoPrescriptionResponse = 
| {
   success: true
   data: []
   message: string
} | {
  success: false
  message: string
}

export interface UndoPrescriptionParams {
  administer_id: Id
  group_prescription_id: Id
  hospital_id: Id
  request_from: string
}

export type PrescriptionDatesResponse = | {
  success: true
  data: PrescriptionDates[]
  message: string
} | {
  success: false
  message: string
  data?: []
}

export interface PrescriptionDatesParams {
  from_date: string
  to_date: string
  hospital_case_id: string
  type: string
  prescription_id: Id
  group_prescription_id: Id
  request_from: string
}

export type AdministerDoseResponse = | { 
  success?: true
  data: []
  message: string
} | {
  success?: false
  data?: []
  message: string
}

export interface AdministerDoseParams {
  hospital_id: Id
  medical_record_id: Id
  medicine_id: Id
  type: AnimalCategory
  purpose: DosePurpose
  side_effect: string | number
  administer_id: Id
  request_from: string
  batch_details: AdministerDoseBatchDetails[] | string
  administritive_time: string
  id?: Id | Id[]
  group_prescription_id?: Id | Id[]
  
}

export type AdditionalDosageResponse = | {
  success: true
  message: string
} | {
  success: false
  message: string
}

export interface AdditionalDosageParams {
  animal_id: Id
  apply_dosage: ApplyDosage
  dosage_times: {
    time: string
    quantity: number | string
    unit_id: Id
  }[]
  hospital_case_id: Id
  medical_record_id: Id
  medicine_id: Id
  medicine_name: string
  prescription_id: Id
  schedule_date: string
}

export type DirectAdministerForPastSlotResponse =
  | {
      success: true
      data: Id
      message: string
    }
  | {
      success: false
      message: string
    }

export interface DirectAdministerForPastSlotParams {
  record_date: string
  animal_id: Id
  created_for: string
  prescription: DirectAdministerScheduleDose[] | string
  request_from: string
  medical_record_id: Id
  is_unscheduled: number
  prescription_id: Id
  medicine_id: Id
  medical_record_type: AnimalCategory
  hospital_case_id: Id
  case_type: number
}

export type AdministerAllMedicineResponse = 
  | {
    success: true
    data: []
    message: string
  }
  | {
    success: false
    message: string
  }

export interface AdministerAllMedicineParams {
  hospital_id: Id
  medical_record_id: Id[]
  medicine_id?: Id
  type: AnimalCategory
  request_from: string
  purpose: DosePurpose
  side_effect?: number
  administer_id?: Id[]
  administritive_time: string
  administer_date?: string
  select_all: number
  q: string
  ignored_ids: Id[] | []
  animal_id: Id
  id?:Id                                            
  group_prescription_id?: Id
}
