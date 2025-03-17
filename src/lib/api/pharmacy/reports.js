import { PHARMACY_BASE_URL, CONSUMPTION_REPORT } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getConsumptionReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${CONSUMPTION_REPORT}`, params, pharmacy: true })

  return response?.data
}
