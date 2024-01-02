// http://3.7.13.80/api/expire-medicine/store?sort=asc&q=&column=label&page=1&limit=7
// http://3.7.13.80/api/outofstock-medicine/store?sort=asc&q=&column=label&page=1&limit=7
import { EXPIRED_MEDICINE, STOCK_OUT } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

const pharmacy = true

export async function getExpiredMedicineList({ params }) {
  const response = await axiosGet({ url: `${EXPIRED_MEDICINE}/store`, params, pharmacy })

  return response.data
}

export async function getStockOutMedicineList({ params }) {
  const response = await axiosGet({ url: STOCK_OUT, params, pharmacy })

  return response.data
}
