import { getSitesByLabId } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function GetLabSitesById({ params }) {
  const response = await axiosGet({ url: `${getSitesByLabId}`, params })

  return response.data
}
