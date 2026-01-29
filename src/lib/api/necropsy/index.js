import { NECROPSY_LISTING, NECROPSY_DETAIL } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getNecropsyListing(params, userId) {
  try {
    const url = `${NECROPSY_LISTING}/${userId}/necropsy_centre`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching necropsy listing:', error.message)
  }
}
