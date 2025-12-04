import {
  GET_MASTERS_HOSPITAL,
  CREATE_MASTERS_HOSPITAL,
  UPDATE_MASTERS_HOSPITAL,
  ANIMAL_MEDICAL_ID_LIST,
  HOSPITAL_STATUS_UPDATE
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getHospitalMaster({ params }) {
  const response = await axiosGet({ url: `${GET_MASTERS_HOSPITAL}`, params: params })

  return response?.data
}

export async function addHospitalMaster(payload) {
  const response = await axiosPost({ url: `${CREATE_MASTERS_HOSPITAL}`, body: payload })

  return response?.data
}

// export async function updateHospitalMaster(id, payload) {
//   const url = `${UPDATE_MASTERS_HOSPITAL}/${id}`
//   const response = await axiosFormPost({ url, body: payload })

//   return response?.data
// }
export async function updateHospitalMaster(id, payload) {
  const url = `${UPDATE_MASTERS_HOSPITAL}`
  const response = await axiosPost({ url: `${UPDATE_MASTERS_HOSPITAL}/${id}`, body: payload })

  return response?.data
}

export const getAnimalMedicalIds = async animalId => {
  const url = `${ANIMAL_MEDICAL_ID_LIST}${animalId}/basic-data-list`
  const response = await axiosGet({ url: url })

  return response?.data
}
