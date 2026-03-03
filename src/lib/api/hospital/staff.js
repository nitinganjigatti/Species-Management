import { GET_HOSPITAL_STAFF } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export const getHospitalStaff = async ({ params }) => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_STAFF}`, params })

  return response?.data
}
