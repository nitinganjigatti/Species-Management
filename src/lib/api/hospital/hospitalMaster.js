import {
  GET_MASTERS_HOSPITAL,
  CREATE_MASTERS_HOSPITAL,
  UPDATE_MASTERS_HOSPITAL,
  ANIMAL_MEDICAL_ID_LIST
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getHospitalMaster({ params }) {
  console.log('getHospitalMaster', params)
  const response = await axiosFormPost({ url: `${GET_MASTERS_HOSPITAL}`, body: params })

  return response?.data
}

export async function addHospitalMaster(payload) {
  console.log(payload, 'payload')
  const response = await axiosFormPost({ url: `${CREATE_MASTERS_HOSPITAL}`, body: payload })

  return response?.data
}

export async function updateHospitalMaster(id, payload) {
  const url = `${UPDATE_MASTERS_HOSPITAL}/${id}`

  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}

export const getAnimalMedicalIds = async animalId => {
  const url = `${ANIMAL_MEDICAL_ID_LIST}${animalId}/basic-data-list`

  const response = await axiosGet({ url: url })

  return response?.data
}

// export async function getHospitalMasterById(id) {
//   console.log(id, 'id')

//   const response = await axiosPost({ url: `${GET_MASTERS_HOSPITAL}/${id}` })
//   console.log(response, 'getHospitalMasterById')

//   return response?.data
// }
