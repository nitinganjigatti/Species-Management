import { axiosGet } from "../utility"
import { HOUSING_SITE_ANALYTICS } from 'src/constants/ApiConstant'

export async function getSiteAnalytics(id) {
  const response = await axiosGet({ url: `${HOUSING_SITE_ANALYTICS}/${id}` })

  return response.data
}