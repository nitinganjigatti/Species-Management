import { PHARMACY_BASE_URL, RETURN_REPORT } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getReturnReport({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${RETURN_REPORT}`, params, pharmacy: true })

  return response?.data
}
