import { ESCROW } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getScrewList({ params }) {
  const response = await axiosGet({ url: `${ESCROW}`, params, pharmacy: true })

  return response.data
}
