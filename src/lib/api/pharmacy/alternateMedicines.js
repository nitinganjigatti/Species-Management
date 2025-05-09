import { MEDICINE, BASE_URL_Pharmacy, ALTERNATE_LIST, ALTERNATE_MAPPING } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getAlternativeMedicineProducts(id, params) {
  console.log('getAlternativeMedicineProducts', id)
  console.log(
    '${BASE_URL_Pharmacy}${MEDICINE}/${ALTERNATE_LIST}/${id}',
    `${BASE_URL_Pharmacy}${MEDICINE}/${ALTERNATE_LIST}/${id}`
  )

  const response = await axiosGet({
    url: `${BASE_URL_Pharmacy}${MEDICINE}/${ALTERNATE_LIST}/${id}`,
    params: params,
    pharmacy: true
  })

  return response.data
}

export async function addNewAlternativeMedicineProducts(body) {
  
  const response = await axiosPost({
    url: `${BASE_URL_Pharmacy}${MEDICINE}/${ALTERNATE_MAPPING}`,
    body,
    pharmacy: true
  })

  return response.data
}
