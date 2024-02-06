import { LEAF } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getLeafs() {
  const response = await axiosGet({ url: LEAF })
  if (response?.status == 200 && response?.data?.success) {
    return response.data.data
  } else {
    return []
  }
}
