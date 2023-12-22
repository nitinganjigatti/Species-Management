import { MEDICINE_SEARCH } from '../../../constants/ApiConstant'
import { axiosGet } from '../utility'
import { MEDICINE } from '../../../constants/ApiConstant'

export async function getMedicineBySearch(name) {
  const response = await axiosGet({ url: `${MEDICINE_SEARCH}${name}`, pharmacy: true })

  return response.data.data
}

export async function getMedicineToAddPurchase(name) {
  const response = await axiosGet({ url: `stock-item?page=1&limit=50&search=a${name}&`, pharmacy: true })

  http: if (response?.status == 200 && response?.data?.success) {
    console.log('medicines', response)

    return response.data.data
  } else {
    return []
  }
}
