import { RETURN_REQUEST } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getRequestReturnList({ params }) {
  const response = await axiosGet({ url: `${RETURN_REQUEST}`, params })

  return response.data
}
