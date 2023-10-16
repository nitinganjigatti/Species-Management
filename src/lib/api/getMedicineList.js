import { MEDICINE } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getMedicineList() {
  const response = await axiosGet({ url: MEDICINE })

  if (response?.status == 200 && response?.data?.success) {
    return response.data.data
  } else {
    return []
  }
}
