import { DISPATCH_VALIDATION } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getDispatchValidation() {
  const response = await axiosGet({ url: DISPATCH_VALIDATION })

  return response.data.data
}
