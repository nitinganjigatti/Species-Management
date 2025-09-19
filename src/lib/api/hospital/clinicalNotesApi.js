import { GET_CLINICAL_NOTES } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getClinicalNotes({ params }) {
  const response = await axiosGet({ url: `${GET_CLINICAL_NOTES}`, params })

  return response?.data
}
