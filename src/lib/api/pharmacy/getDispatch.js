import { DISPATCH } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getDispatch() {
  const response = await axiosGet({ url: DISPATCH })

  return response.data.data
}
