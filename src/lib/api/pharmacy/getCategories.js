import { ADD, CATEGORIES, EDIT, LIST, PHARMACY_MASTER_BASE_URL, PRODUCT_CATEGORY } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getCategories() {
  const response = await axiosGet({ url: CATEGORIES })

  return response.data.data
}

export async function getCategoryById(id) {
  const response = await axiosGet({ url: `${CATEGORIES}/${id}/show` })

  return response.data
}

export async function addCategory(payload) {
  try {
    const url = `${CATEGORIES}`
    var data = payload
    const response = await axiosPost({ url, body: data })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function updateCategory(id, payload) {
  try {
    const url = `${CATEGORIES}/${id}/update`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data })

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

export async function addProductCategory(payload) {
  const url = `${PHARMACY_MASTER_BASE_URL}${PRODUCT_CATEGORY}/${ADD}`
  var data = payload
  const response = await axiosPost({ url, body: data, pharmacy: true })

  return response?.data
}

export async function updateProductCategory(id, payload) {
  try {
    const url = `${PHARMACY_MASTER_BASE_URL}${PRODUCT_CATEGORY}/${EDIT}/${id}`
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

export async function getProductCategoriesList({ params }) {
  const response = await axiosGet({
    url: `${PHARMACY_MASTER_BASE_URL}${PRODUCT_CATEGORY}/${LIST}`,
    params,
    pharmacy: true
  })

  return response.data
}

export async function getProductCategoryById(id) {
  const response = await axiosGet({ url: `${PHARMACY_MASTER_BASE_URL}${PRODUCT_CATEGORY}/${id}`, pharmacy: true })

  return response.data
}
