import { STOCK_BY_BATCH } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStocksByBatch(id) {
  const response = await axiosGet({ url: `${STOCK_BY_BATCH}/${id}`, pharmacy: true })

  return response.data
}
