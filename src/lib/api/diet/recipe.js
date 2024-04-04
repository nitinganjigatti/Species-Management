import {
  DETAILS,
  DIET,
  RECIPES,
  UOM,
  LIST,
  LISTING,
  ADD,
  DELETE,
  UPDATE_STATUS,
  UPDATE
} from '../../../constants/ApiConstant'
import { axiosGet, axiosFormPost, axiosPost } from '../utility'

export async function getRecipeList({ params }) {
  const response = await axiosGet({ url: `${DIET}/${RECIPES}/${LISTING}`, params })

  return response.data
}

export async function getRecipeDetail(id) {
  return await axiosGet({ url: `${DIET}/${RECIPES}/${DETAILS}/${id}` })
}

export async function getUnitsForRecipe({ params }) {
  const response = await axiosGet({ url: `${DIET}/${UOM}/${LIST}`, params })

  return response.data
}

export async function addNewRecipe(payload) {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${RECIPES}/${ADD}`, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function deleteRecipe(id) {
  try {
    const response = await axiosPost({ url: `${DIET}/${RECIPES}/${DELETE}/${id}` })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function updateRecipeStatus(id, payload) {
  try {
    const response = await axiosPost({ url: `${DIET}/${RECIPES}/${UPDATE_STATUS}/${id}`, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function updateRecipe(id, payload) {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${RECIPES}/${UPDATE}/${id}`, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}
