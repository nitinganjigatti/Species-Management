import { STOCK_BY_BATCH } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getStocksByBatch(id) {
  const response = await axiosGet({ url: `${STOCK_BY_BATCH}/${id}?page=1&limit=25&search=&` })

  return response.data
}
