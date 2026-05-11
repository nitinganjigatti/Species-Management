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

export async function getRecipeList({ params }: { params?: Record<string, any> }): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${RECIPES}/${LISTING}`, params })

  return response.data
}

export async function getRecipeDetail(id: string | number): Promise<any> {
  return await axiosGet({ url: `${DIET}/${RECIPES}/${DETAILS}/${id}` })
}

export async function getUnitsForRecipe({ params }: { params?: Record<string, any> }): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${UOM}/${LIST}`, params })

  return response.data
}

export async function addNewRecipe(payload?: Record<string, any> | FormData): Promise<any> {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${RECIPES}/${ADD}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function deleteRecipe(id: string | number, payload?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({ url: `${DIET}/${RECIPES}/${DELETE}/${id}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function updateRecipeStatus(id: string | number, payload?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({ url: `${DIET}/${RECIPES}/${UPDATE_STATUS}/${id}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function updateRecipe(id: string | number, payload?: Record<string, any> | FormData): Promise<any> {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${RECIPES}/${UPDATE}/${id}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}
