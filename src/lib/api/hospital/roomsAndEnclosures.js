import {
  CREATE_ROOMS_AND_ENCLOSURES,
  DELETE_ROOMS_AND_ENCLOSURES,
  GET_HOSPITAL_ROOMS,
  GET_ROOMS_AND_ENCLOSURES
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export async function getRoomsAndEnclosures(params) {
  const response = await axiosGet({ url: `${GET_ROOMS_AND_ENCLOSURES}`, params: params })

  return response?.data
}

export async function addRoomsAndEnclosures(payload) {
  const response = await axiosFormPost({ url: `${CREATE_ROOMS_AND_ENCLOSURES}`, body: payload })

  return response?.data
}

export async function deleteRoomsAndEnclosures(payload) {
  const response = await axiosFormPost({ url: `${DELETE_ROOMS_AND_ENCLOSURES}`, body: payload })

  return response?.data
}

export async function updateRoomsAndEnclosures(id, payload) {
  // const url = `${UPDATE_MASTERS_HOSPITAL}/${id}`
  //   const response = await axiosFormPost({ url, body: payload })
  //   return response?.data
}

export async function getHospitalRoomsList(params) {
  const response = await axiosGet({ url: `${GET_HOSPITAL_ROOMS}`, params: params })

  return response?.data
}
