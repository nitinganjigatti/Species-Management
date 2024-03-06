import { getSitesByLabId, getUserByLabId } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function GetLabSitesById({ params }) {
  const response = await axiosGet({ url: `${getSitesByLabId}`, params })

  return response.data
}

export async function GetLabUsersById({ params }) {
  const response = await axiosGet({ url: `${getUserByLabId}`, params })

  return response.data
}
