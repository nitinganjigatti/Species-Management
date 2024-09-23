import {
  MEDICINE,
  PHARMACY_BASE_URL,
  LOCAL_STOCK_REPORT,
  DASHBOARD_STORE_WISE_DISPATCH_REPORT
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

// export async function getStoreWiseDispatchList({ params }) {
//   const response = await axiosGet({ url: `${DASHBOARD_STORE_WISE_DISPATCH_REPORT}`, params })

//   return response.data
// }

export async function getStoreWiseDispatchList(payload) {
  const url = `${DASHBOARD_STORE_WISE_DISPATCH_REPORT}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}
