import {
  INGREDIENT_LIST,
  INGREDIENTS_DETAIL,
  DIET,
  INGREDIENT,
  UPDATE_STATUS,
  DELETE
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getIngredientList({ params }) {
  const response = await axiosGet({ url: `${INGREDIENT_LIST}`, params })

  return response.data
}

export async function getIngredientDetail(id) {
  return await axiosGet({ url: `${INGREDIENTS_DETAIL}/${id}` })
}

export async function updateIngredientStatus(id, payload) {
  try {
    const response = await axiosPost({ url: `${DIET}/${INGREDIENT}/${UPDATE_STATUS}/${id}`, body: payload })

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
    const response = await axiosPost({ url: `${DIET}/${INGREDIENT}/${DELETE}/${id}` })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}
