import { ADD_NURSERY, ROOM_LIST } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../../utility'

export async function AddRoom(payload) {
  const response = await axiosFormPost({ url: `${ADD_NURSERY}/room/add`, body: payload, pharmacy: true })

  return response.data
}

export async function EditRoom(id, payload) {
  const response = await axiosFormPost({ url: `${ADD_NURSERY}/room/${id}/edit`, body: payload, pharmacy: true })

  return response.data
}

export async function GetRoomList({ params }) {

  const response = await axiosGet({ url: `${ADD_NURSERY}/${ROOM_LIST}`, params: params, pharmacy: true })

  return response.data
}

export async function GetRoomDetails(id) {
  const response = await axiosGet({ url: `${ADD_NURSERY}/room/${id}` })

  return response.data
}
