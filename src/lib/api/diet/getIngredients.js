import {
  INGREDIENTS_DETAIL,
  DIET,
  INGREDIENT,
  UPDATE_STATUS,
  DELETE,
  RECIPE_LIST,
  INGREDIENTS,
  LIST,
  RECIPE
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getIngredientList({ params }) {
  const response = await axiosGet({ url: `${DIET}/${INGREDIENTS}/${LIST}`, params })

  return response.data
}

export async function getIngredientDetail(id) {
  return await axiosGet({ url: `${DIET}/${INGREDIENTS}/${INGREDIENTS_DETAIL}/${id}` })
}

export async function updateIngredientStatus(id, payload) {
  try {
    const response = await axiosPost({ url: `${DIET}/${INGREDIENTS}/${UPDATE_STATUS}/${id}`, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function deleteIngredient(id) {
  try {
    const response = await axiosPost({ url: `${DIET}/${INGREDIENTS}/${DELETE}/${id}` })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function getRecipeListonIngredientDtl(id, params) {
  return await axiosGet({ url: `${DIET}/${RECIPE}/${RECIPE_LIST}/${id}`, params })
}
