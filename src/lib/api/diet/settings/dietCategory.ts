import { DIET_CATEGORIES_LIST, ADD_DIET_CATEGORY, UPDATE_DIET_CATEGORY, GET_DIET_CATEGORY_BY_ID } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getDietCategoryList(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${DIET_CATEGORIES_LIST}`, params })

  return response.data
}

export async function addDietCategory(payload?: Record<string, any>): Promise<any> {
  try {
    const url = `${ADD_DIET_CATEGORY}`
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getDietCategoryById(id: string | number): Promise<any> {
  const response = await axiosGet({ url: `${GET_DIET_CATEGORY_BY_ID}/${id}/show` })

  return response.data
}

export async function UpdateDietCategory(id: string | number, payload?: Record<string, any>): Promise<any> {
  try {
    const url = `${UPDATE_DIET_CATEGORY}/${id}`
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
