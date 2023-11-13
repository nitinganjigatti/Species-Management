import { SALTS, MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getSalts() {
  const response = await axiosGet({ url: `${MASTER_BASE_URL}${SALTS}/list` })

  return response.data
}

export async function addSalt(payload) {
  const url = `${MASTER_BASE_URL}${SALTS}/add`
  var data = payload
  const response = await axiosPost({ url, body: data })

  return response?.data
}
