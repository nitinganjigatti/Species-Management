import { MEDICAL_MASTER_DATA } from 'src/constants/ApiConstant'
import { axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import type { ApiResponse } from 'src/types/hospital'
import { GetMedicalMasterDataResponse } from 'src/types/hospital/api/PrescriptionMonitoring/prescription';

export async function getMedicalMasterData(): Promise<GetMedicalMasterDataResponse> {
  try {
    const url = `${MEDICAL_MASTER_DATA}`

    const response = await axiosGet({ url })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medical master data:', err.message)

    return { success: false, message: err.message }
  }
}
