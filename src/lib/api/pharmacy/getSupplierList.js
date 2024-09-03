import { SUPPLIER } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getSuppliers() {
  return await axiosGet({ url: SUPPLIER, pharmacy: true })
}

export async function getSupplierById(id) {
  const response = await axiosGet({ url: `${SUPPLIER}/${id}/show`, pharmacy: true })

  return response.data.data
}

export async function updateSuppliersById(payload, id) {
  try {
    const url = `${SUPPLIER}/${id}/update`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    console.error(url)
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
