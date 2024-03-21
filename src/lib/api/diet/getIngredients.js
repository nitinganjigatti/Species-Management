import { INGREDIENT_LIST, INGREDIENTS_DETAIL } from '../../../constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getIngredientList({ params }) {
  const response = await axiosGet({ url: `${INGREDIENT_LIST}`, params })

  return response.data
}

export async function getIngredientDetail(id) {
  return await axiosGet({ url: `${INGREDIENTS_DETAIL}/${id}` })
}
