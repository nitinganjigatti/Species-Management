import { LISTING, DIET } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getDietList(params) {
  const response = await axiosGet({ url: `${DIET}/${LISTING}`, params })

  return response.data
}
