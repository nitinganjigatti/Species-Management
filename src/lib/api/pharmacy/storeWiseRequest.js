import { PHARMACY_BASE_URL, All_STORES_REQUESTS } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

const pharmacy = true

export async function getRequestListsOfAllStores({ params }) {
  const url = `${PHARMACY_BASE_URL}${All_STORES_REQUESTS}`

  const response = await axiosGet({ url, params, pharmacy })

  return response?.data
}
