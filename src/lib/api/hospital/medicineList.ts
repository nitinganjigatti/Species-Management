import { MEDICINE_LIST } from 'src/constants/ApiConstant'
import { axiosGet as _axiosGet } from '../utility'

const axiosGet = _axiosGet as (params: { url: string; params?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

import { GetMedicineListParams, GetMedicineListResponse } from 'src/types/hospital/api/PrescriptionMonitoring/medicineBatch';

export async function getMedicineList({
  params
}: {
  params: GetMedicineListParams
}): Promise<GetMedicineListResponse> {
  try {
    const url = `${MEDICINE_LIST}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    const err = error as Error
    console.error('Error fetching medicine list:', err.message)

    return { success: false, message: err.message }
  }
}
