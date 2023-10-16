import { DEBIT_NOTE } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getDebitNote() {
  const response = await axiosGet({ url: DEBIT_NOTE })

  return response.data.data
}
