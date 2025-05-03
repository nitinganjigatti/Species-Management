import { BASE_URL_Pharmacy, STOCK_LIST } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getStockItem({ params }) {
  const response = await axiosGet({ url: `${BASE_URL_Pharmacy}${STOCK_LIST}/config/list`, params, pharmacy: true })

  return response?.data
}

export async function addStockItem({ id, payload }) {
  const response = await axiosPost({
    url: `${BASE_URL_Pharmacy}${STOCK_LIST}/${id}/config`,
    body: payload,
    pharmacy: true
  })

  return response?.data
}

export async function getShelvesList({ id, params }) {
  const response = await axiosGet({ url: `${BASE_URL_Pharmacy}rack/${id}/shelf`, params, pharmacy: true })

  return response?.data
}

export async function getConfigMedicine({ id, params }) {
  const response = await axiosGet({ url: `${BASE_URL_Pharmacy}stock-item/config/list/${id}`, params, pharmacy: true })

  return response?.data
}
