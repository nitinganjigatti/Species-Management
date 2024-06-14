import {
  FEED_DETAILS,
  INGREDIENT_LIST,
  FEED,
  ADD_INGREDIENT,
  INGREDIENT_DETAIL,
  UPDATE_INGREDIENT,
  DIET,
  LIST,
  UOM,
  UPDATE_STATUS,
  DELETE
} from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export async function getFeedDetails(id) {
  return await axiosGet({ url: `${DIET}/${FEED}/${FEED_DETAILS}/${id}` })
}

export async function getIngredientsOnFeed(id, params) {
  return await axiosGet({ url: `${DIET}/${FEED}/${INGREDIENT_LIST}/${id}`, params })
}

export async function getUnitsForIngredient({ params }) {
  const response = await axiosGet({ url: `${DIET}/${UOM}/${LIST}`, params })

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

export async function getIngredientDetails(id) {
  const response = await axiosGet({ url: `${INGREDIENT_DETAIL}/${id}` })

  return response.data
}

export async function updateIngredients(payload, id) {
  try {
    const url = `${UPDATE_INGREDIENT}/${id}`
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

export async function feedStatusChange(payload, id) {
  try {
    const url = `${DIET}/${FEED}/${UPDATE_STATUS}/${id}`
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

export async function feedDelete(id) {
  try {
    const url = `${DIET}/${FEED}/${DELETE}/${id}`
    const response = await axiosFormPost({ url })

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
