import { MEDICINE_SEARCH } from '../../constants/ApiConstant'
import { axiosGet } from './utility'

export async function getMedicineBySearch(name) {
  const response = await axiosGet({ url: `${MEDICINE_SEARCH}${name}` })

  return response.data.data
}
