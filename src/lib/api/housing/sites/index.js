import { GET_SITES } from 'src/constants/ApiConstant'
import { axiosGet } from '../../utility'

export async function getAllSites(params) {
  const response = await axiosGet({ url: `${GET_SITES}`, params })
  return response.data
}
