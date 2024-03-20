import { FEED_DETAILS, INGREDIENTS_LIST, FEED, UOM_LIST, ADD_INGREDIENT } from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export async function getFeedDetails(id) {
  return await axiosGet({ url: `${FEED_DETAILS}/${id}` })
}

export async function getIngredientsOnFeed(id, params) {
  return await axiosGet({ url: `${FEED}/${INGREDIENTS_LIST}/${id}`, params })
}

export async function getUnitsForIngredient({ params }) {
  const response = await axiosGet({ url: `${UOM_LIST}`, params })

  return response.data
}

export async function addIngredients(payload) {
  try {
    const url = `${ADD_INGREDIENT}`
    const response = await axiosFormPost({ url, body: payload })

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
