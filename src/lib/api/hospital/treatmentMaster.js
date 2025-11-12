import { GET_TREATMENT_MASTER_LIST } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export const getTreatmentMasterList = async ({ q = '', page = 0, limit = 10 } = {}) => {
  try {
    const response = await axiosGet({
      url: GET_TREATMENT_MASTER_LIST,
      params: { q, page, limit }
    })

    return response?.data
  } catch (error) {
    console.error('Error fetching treatment master list:', error?.message || error)
    throw error
  }
}

