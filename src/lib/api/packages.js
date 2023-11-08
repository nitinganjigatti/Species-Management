import { PACKAGES, MASTER_BASE_URL } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getPackages() {
  const response = await axiosGet({ url: `${MASTER_BASE_URL}${PACKAGES}/list` })

  return response.data
}

export async function addPackages(payload) {
  const url = `${MASTER_BASE_URL}${PACKAGES}/add`
  var data = payload
  const response = await axiosPost({ url, body: data })

  return response?.data
}
