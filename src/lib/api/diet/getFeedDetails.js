import { FEED_DETAILS, INGREDIENTS_LIST, FEED, INGREDIENT_LIST } from '../../../constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getFeedDetails(id) {
  return await axiosGet({ url: `${FEED_DETAILS}/${id}` })
}

export async function getIngredientsOnFeed(id, params) {
  return await axiosGet({ url: `${FEED}/${INGREDIENTS_LIST}/${id}`, params })
}

export async function getIngredientList({ params }) {
  const response = await axiosGet({ url: `${INGREDIENT_LIST}`, params })

  return response.data
}
