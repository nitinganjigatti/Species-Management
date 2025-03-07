import { PHARMACY_BASE_URL, PURCHASE_REPORT } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getPurchaseReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${PURCHASE_REPORT}`, params, pharmacy: true })

  return response?.data
}
