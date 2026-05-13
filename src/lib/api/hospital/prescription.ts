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

export async function addPrescription(
  payLoad: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
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
  payLoad: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  try {
    const response = await axiosFormPost({ url: `${ADD_DIRECT_ADMINISTER_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getPrescriptions(params: PrescriptionListParams): Promise<PrescriptionListResponse> {
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

export async function getPrescriptionDetails(params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
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
  payLoad: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  try {
    const response = await axiosFormPost({ url: `${MEDICINE_SIDE_EFFECT}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getDates(params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
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

export async function getFrequency(params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  try {
    const url = `${GET_FREQUENCY}`

    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical master data:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getIntervalList(params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  try {
    const url = `${GET_INTERVALS}`

    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical master data:', err.message)

    return { success: false, message: err.message }
  }
}

export async function getMedicineBatches(params: Record<string, unknown>): Promise<ApiResponse<unknown>> {
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

export async function stopPrescription(payLoad: Record<string, unknown>): Promise<ApiResponse<unknown>> {
  try {
    const response = await axiosPost({ url: `${STOP_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error adding prescription:', err.message)

    return { success: false, message: err.message }
  }
}

export async function undoPrescription(payLoad: Record<string, unknown>): Promise<ApiResponse<unknown>> {
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
  payLoad: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
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
  payLoad: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
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
  payLoad: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
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
  payLoad: FormData | Record<string, unknown>
): Promise<ApiResponse<unknown>> {
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
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
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
  params: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
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
