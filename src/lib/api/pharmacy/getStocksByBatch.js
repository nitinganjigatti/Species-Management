import { STOCK_BY_BATCH } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStocksByBatch(id, params) {
  const response = await axiosGet({ url: `${STOCK_BY_BATCH}/${id}`, params, pharmacy: true })

  return response.data
}
