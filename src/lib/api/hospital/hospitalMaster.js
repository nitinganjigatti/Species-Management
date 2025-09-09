import { GET_MASTERS_HOSPITAL, CREATE_MASTERS_HOSPITAL, UPDATE_MASTERS_HOSPITAL } from 'src/constants/ApiConstant'
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

// export async function getHospitalMasterById(id) {
//   console.log(id, 'id')

//   const response = await axiosPost({ url: `${GET_MASTERS_HOSPITAL}/${id}` })
//   console.log(response, 'getHospitalMasterById')

//   return response?.data
// }
