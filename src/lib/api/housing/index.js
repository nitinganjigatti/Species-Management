import { axiosGet } from '../utility'
import { GET_SITES, HOUSING_SITE_ANALYTICS } from 'src/constants/ApiConstant'

export async function getSiteAnalytics(id) {
  const response = await axiosGet({ url: `${HOUSING_SITE_ANALYTICS}/${id}` })

  return response.data
}

export async function getAllSites(params) {
  const response = await axiosGet({ url: `${GET_SITES}`, params })
  return response.data
}
