import { USER_REFRESH_TOKEN_API } from 'src/constants/ApiConstant'
import { axiosPost } from './utility'

// Legacy flow — refreshes an Antz HS256 JWT on page reload when USE_SSO=false.
export async function callRefreshToken() {
  const url = `${USER_REFRESH_TOKEN_API}`
  const response = await axiosPost({ url })

  return response?.data
}
