import { STOCK_BY_BATCH } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getStocksByBatch() {
  const response = await axiosGet({ url: STOCK_BY_BATCH })

  return response.data.data
}
