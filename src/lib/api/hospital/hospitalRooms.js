import {
  GET_HOSPITAL_ROOMS,
  CREATE_HOSPITAL_ROOM,
  UPDATE_HOSPITAL_ROOM,
  HOSPITAL_STATUS_UPDATE
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getHospitalRooms({ params }) {
  const response = await axiosGet({ url: `${GET_HOSPITAL_ROOMS}`, params: params })

  return response?.data
}

export async function addHospitalRoom(payload) {
  const response = await axiosFormPost({ url: `${CREATE_HOSPITAL_ROOM}`, body: payload })

  return response?.data
}

export async function updateHospitalRoom(payload) {
  const url = `${UPDATE_HOSPITAL_ROOM}`
  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}

export async function updateHospitalStatus(payload) {
  const url = `${HOSPITAL_STATUS_UPDATE}`
  const response = await axiosFormPost({ url, body: payload })

  return response?.data
}
