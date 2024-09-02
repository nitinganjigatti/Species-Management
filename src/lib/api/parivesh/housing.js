import { USERS_REPORT } from 'src/constants/ApiConstant'
import { axiosPost } from '../utility'

export async function getUsersReportList() {
  debugger
  const response = await axiosPost({ url: `${USERS_REPORT}` })

  return response.data
}
