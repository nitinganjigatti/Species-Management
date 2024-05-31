import { ADD_NURSERY } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../../utility'

export async function AddNursery(payload) {
  debugger
  const response = await axiosFormPost({ url: `${ADD_NURSERY}/add`, body: payload, pharmacy: true })
  return response.data
}

export async function GetNurseryList({params}) {
  const response = await axiosGet({ url: `${ADD_NURSERY}/list`, params: params, pharmacy: true })
  return response.data
}
