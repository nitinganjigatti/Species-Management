import { GET_HOSPITAL_STAFF } from 'src/constants/ApiConstant'
import { UPDATE_HOSPITAL_CHIEF_DOCTOR } from "src/constants/ApiConstant";
import { REMOVE_HOSPITAL_CHIEF_DOCTOR } from 'src/constants/ApiConstant';
import { axiosGet, axiosPost } from '../utility'


export const getHospitalStaff = async ({ params }) => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_STAFF}`, params })

  return response?.data
}

export const updateHospitalChiefDoctor = async params => {
  try {
  const url = `${UPDATE_HOSPITAL_CHIEF_DOCTOR}`
  const response = await axiosPost({url: url, body: params})
  return response?.data
} catch (error){
  console.error('Chief doctor already selected', error?.message)
  throw error
}
}

export const removeHospitalChiefDoctor = async params => {
  try {
    const url = `${REMOVE_HOSPITAL_CHIEF_DOCTOR}`
    const response = await axiosPost({url: url, body: params})
    return response?.data
  } catch (error){
    console.error('Error removing chief doctor', error?.message)
  }
}

