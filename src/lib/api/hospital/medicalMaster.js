import { MEDICAL_MASTER_DATA } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getMedicalMasterData(params) {
  try {
    const url = `${MEDICAL_MASTER_DATA}`

    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical master data:', error.message)
  }
}


