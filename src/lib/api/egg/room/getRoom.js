import { ADD_NURSERY, ROOM_LIST } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../../utility'

export async function AddRoom(payload) {
  debugger
  const response = await axiosFormPost({ url: `${ADD_NURSERY}/add`, body: payload, pharmacy: true })

  return response.data
}

export async function GetRoomList({ params }) {
  const response = await axiosGet({ url: `${ADD_NURSERY}/${ROOM_LIST}`, params: params, pharmacy: true })

  return response.data
}

export async function GetRoomDetails(id, params) {
  const response = await axiosGet({ url: `${ADD_NURSERY}/room/${id}`, params })

  return response.data
}
