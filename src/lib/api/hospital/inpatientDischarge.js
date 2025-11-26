import { ADD_DISCHARGE } from 'src/constants/ApiConstant'
import { axiosFormPost } from '../utility'

export async function addInpatientDischarge(payload) {
  const response = await axiosFormPost({ url: `${ADD_DISCHARGE}`, body: payload })

  return response?.data
}
