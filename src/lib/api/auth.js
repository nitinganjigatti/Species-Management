import { USER_REFRESH_TOKEN_API } from 'src/constants/ApiConstant'
import { axiosPost } from './utility'

export async function callRefreshToken() {
  const url = `${USER_REFRESH_TOKEN_API}`
  const response = await axiosPost({ url })

  return response?.data
}
