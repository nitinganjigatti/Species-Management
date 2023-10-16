import { PURCHASE } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getPurchaseList() {
  const response = await axiosGet({ url: PURCHASE })

  return response.data.data
}
