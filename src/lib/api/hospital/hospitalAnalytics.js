import { HOSPITAL_BED_STATS, HOSPITAL_DETAIL, HOSPITAL_LISTING } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getHospitalListing(params, userId) {
  try {
    const url = `${HOSPITAL_LISTING}/${userId}/hospital`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getHospitalBedStats(id, params) {
  try {
    const url = `${HOSPITAL_BED_STATS}${id}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getHospitalDetail(id, params) {
  try {
    const url = `${HOSPITAL_DETAIL}${id}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}
