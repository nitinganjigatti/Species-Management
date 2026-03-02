import { MEDICINE_LIST } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getMedicineList({ params }) {
  try {
    const url = `${MEDICINE_LIST}`
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medicine list:', error.message)
  }
}
