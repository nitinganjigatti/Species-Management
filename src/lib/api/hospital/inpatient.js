import { ADD_HOSPITAL_PATIENT } from 'src/constants/ApiConstant'
import { axiosFormPost } from '../utility'

export const addHospitalPatient = async payload => {
  const response = await axiosFormPost({ url: `${ADD_HOSPITAL_PATIENT}`, body: payload })

  return response?.data
}
