import { ADD_NURSERY } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../../utility'

export async function AddNursery(payload) {
  const response = await axiosFormPost({ url: `${ADD_NURSERY}/add`, body: payload, pharmacy: true })

  return response.data
}

export async function GetNurseryList({ params }) {
  const response = await axiosGet({ url: `${ADD_NURSERY}/list`, params: params, pharmacy: true })

  return response.data
}

export async function GetNurseryDetailsById(id) {
  const response = await axiosGet({ url: `${ADD_NURSERY}/${id}`, pharmacy: true })

  return response.data
}

export async function UpdateNursery(id, payload) {
  const response = await axiosFormPost({ url: `${ADD_NURSERY}/${id}/edit`, body: payload, pharmacy: true })

  return response.data
}

export async function GetRoomByNursery(id, params) {
  
  const response = await axiosGet({ url: `${ADD_NURSERY}/room/list?nursery_id=${id}`, params: params, pharmacy: true })

  return response.data
}
