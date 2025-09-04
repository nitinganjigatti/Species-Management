import { GET_INCOMING_PATIENTS_LISTS } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export const getIncomingPatients = async params => {
  const response = await axiosGet({ url: `${GET_INCOMING_PATIENTS_LISTS}`, params })

  return response?.data
}
