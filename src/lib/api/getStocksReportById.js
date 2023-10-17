import { STOCK_REPORT } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getStocksReportById(id) {
  const response = await axiosGet({ url: `${STOCK_REPORT}/${id}` })

  return response.data.data
}
