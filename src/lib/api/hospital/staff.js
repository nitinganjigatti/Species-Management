import { GET_HOSPITAL_STAFF } from 'src/constants/ApiConstant'
import { ADD_CHIEF_DOCTOR } from "src/constants/ApiConstant";
import { REMOVE_CHIEF_DOCTOR } from 'src/constants/ApiConstant';
import { axiosGet, axiosPost } from '../utility'


export const getHospitalStaff = async ({ params }) => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_STAFF}`, params })

  return response?.data
}

export const addChiefDoctor = async params => {
  try {
  const url = `${ADD_CHIEF_DOCTOR}`
  const response = await axiosPost({url: url, body: params})
  return response?.data
} catch (error){
  console.error('Chief doctor already selected', error?.message)
  throw error
}
}

export const removeChiefDoctor = async params => {
  try {
    const url = `${REMOVE_CHIEF_DOCTOR}`
    const response = await axiosPost({url: url, body: params})
    return response?.data
  } catch (error){
    console.error('Error removing chief doctor', error?.message)
  }
}

