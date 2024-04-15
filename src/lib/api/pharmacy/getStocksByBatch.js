import { STOCK_BY_BATCH } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getStocksByBatch(id, params) {
  if (id === 'all') {
    const response = await axiosGet({ url: `${STOCK_BY_BATCH}`, params, pharmacy: true })
  } else {
    const response = await axiosGet({ url: `${STOCK_BY_BATCH}/${id}`, params, pharmacy: true })
  }

  return response.data
}
