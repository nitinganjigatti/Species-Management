import axios from 'axios'
import { SUPPLIER_LEDGER } from '../../../constants/ApiConstant'

export async function getSupplierLedger(id, startDate, endDate) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${SUPPLIER_LEDGER}/${id}/start/${startDate}/end/${endDate}`
  console.log('url', url)

  return axios.get(url)
}
