import {
  ADD_DIRECT_ADMINISTER_PRESCRIPTION,
  ADD_PRESCRIPTION,
  ADMINISTER_ALL_MEDICINES,
  ADMINISTER_PRESCRIPTION,
  DIRECT_ADMINISTER_FOR_PAST_SLOT,
  GET_BATCH_LIST,
  GET_FREQUENCY,
  GET_INTERVALS,
  GET_PRESCRIPTION_BY_RECORD,
  GET_PRESCRIPTION_DETAILS,
  GET_PRESCRIPTION_DETAILS_DATES,
  GET_PRESCRIPTION_LIST,
  GET_TRANSFER_CHECK,
  MEDICINE_SIDE_EFFECT,
  SCHEDULE_PRESCRIPTION,
  STOP_PRESCRIPTION,
  UNDO_PRESCRIPTION,
  VALIDATE_PRESCRIPTION_BEFORE_UPDATE
} from 'src/constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type {
  ApiResponse,
  PrescriptionListParams,
  PrescriptionListResponse
} from 'src/types/hospital'
import { AddDirectAdministerParams, AddDirectAdministerResponse, AddPrescriptionParams, AddPrescriptionResponse, GetIntervalListResponse, GetPrescriptionFrequencyResponse, GetPrescriptionListParams, GetPrescriptionListResponse, GetPrescriptionMedicineSideEffectParams, GetPrescriptionMedicineSideEffectResponse,RestartStopMedicineResponse,UpdatePrescriptionParams, UpdatePrescriptionResponse, RestartMedicineParams, StopMedicineParams, UndoPrescriptionResponse, UndoPrescriptionParams, PrescriptionDatesResponse, PrescriptionDatesParams, AdministerDoseResponse, AdministerDoseParams, AdditionalDosageResponse, AdditionalDosageParams, DirectAdministerForPastSlotResponse, DirectAdministerForPastSlotParams, AdministerAllMedicineResponse, AdministerAllMedicineParams } from 'src/types/hospital/api/PrescriptionMonitoring/prescription';
import { GetPrescriptionDetailsParams, GetPrescriptionDetailsResponse } from 'src/types/hospital/api/PrescriptionMonitoring/prescriptionDetails';
import { GetMedicineBatchListParams, GetMedicineBatchListResponse } from 'src/types/hospital/api/PrescriptionMonitoring/medicineBatch';
import { PrescriptionRecordParams, PrescriptionRecordResponse } from 'src/types/hospital/api/Discharge/prescriptionRecord';

export async function addPrescription(
  payLoad: FormData | AddPrescriptionParams
): Promise<AddPrescriptionResponse> {
  try {
    const response = await axiosFormPost({ url: `${ADD_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function addDirectAdministerPrescription(
  payLoad: AddDirectAdministerParams
): Promise<AddDirectAdministerResponse> {
  try {
    const response = await axiosFormPost({ url: `${ADD_DIRECT_ADMINISTER_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getPrescriptions(params: GetPrescriptionListParams): Promise<GetPrescriptionListResponse> {
  try {
    const url = GET_PRESCRIPTION_LIST
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getPrescriptionDetails(params: GetPrescriptionDetailsParams): Promise<GetPrescriptionDetailsResponse> {
  try {
    const url = GET_PRESCRIPTION_DETAILS
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getSideEffectMedicines(
  payLoad: GetPrescriptionMedicineSideEffectParams
): Promise<GetPrescriptionMedicineSideEffectResponse> {
  try {
    const response = await axiosFormPost({ url: `${MEDICINE_SIDE_EFFECT}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getDates(params: PrescriptionDatesParams): Promise<PrescriptionDatesResponse> {
  try {
    const url = GET_PRESCRIPTION_DETAILS_DATES
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching clinical notes:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getFrequency(): Promise<GetPrescriptionFrequencyResponse> {
  try {
    const url = `${GET_FREQUENCY}`

    const response = await axiosGet({ url })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical master data:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getIntervalList(): Promise<GetIntervalListResponse> {
  try {
    const url = `${GET_INTERVALS}`

    const response = await axiosGet({ url })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical master data:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getMedicineBatches(params: GetMedicineBatchListParams): Promise<GetMedicineBatchListResponse> {
  try {
    const url = `${GET_BATCH_LIST}`

    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical master data:', err.message)

    return { success: false, message: err.message }
  }
}

export async function stopPrescription(payLoad: RestartMedicineParams | StopMedicineParams): Promise<RestartStopMedicineResponse> {
  try {
    const response = await axiosPost({ url: `${STOP_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function undoPrescription(payLoad: UndoPrescriptionParams): Promise<UndoPrescriptionResponse> {
  try {
    const response = await axiosPost({ url: `${UNDO_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function administerDose(
  payLoad: AdministerDoseParams
): Promise<AdministerDoseResponse> {
  try {
    const response = await axiosFormPost({ url: `${ADMINISTER_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function administerAllMedicines(
  payLoad: AdministerAllMedicineParams
): Promise<AdministerAllMedicineResponse> {
  try {
    const response = await axiosPost({ url: `${ADMINISTER_ALL_MEDICINES}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function schedulePrescription(
  payLoad: AdditionalDosageParams
): Promise<AdditionalDosageResponse> {
  try {
    const response = await axiosPost({ url: `${SCHEDULE_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function directAdministerForPatSlot(
  payLoad: DirectAdministerForPastSlotParams
): Promise<DirectAdministerForPastSlotResponse> {
  try {
    const response = await axiosFormPost({ url: `${DIRECT_ADMINISTER_FOR_PAST_SLOT}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getPrescriptionsByRecord(
  params: PrescriptionRecordParams
): Promise<PrescriptionRecordResponse> {
  try {
    const url = GET_PRESCRIPTION_BY_RECORD
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching Prescriptions Record:', err?.message)

    return { success: false, message: err.message }
  }
}

export async function getSecurityCheckForTransfer(siteId: string | number): Promise<ApiResponse<unknown>> {
  const response = await axiosGet({ url: `${GET_TRANSFER_CHECK}/${siteId}` })

  return response?.data
}

export async function validatePrescriptionUpdate(
  params: UpdatePrescriptionParams
): Promise<UpdatePrescriptionResponse> {
  try {
    const url = `${VALIDATE_PRESCRIPTION_BEFORE_UPDATE}`

    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical master data:', err.message)

    return { success: false, message: err.message }
  }
}
