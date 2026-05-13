import {
  INGREDIENTS_DETAIL,
  DIET,
  PREPARATIONS,
  UPDATE_STATUS,
  DELETE,
  RECIPE_LIST,
  INGREDIENTS,
  INGREDIENT,
  LIST,
  RECIPE,
  REPARATION_ACTIVITY_LOGS,
  RECIPE_PARTOF_DIET_LIST
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getIngredientList({ params }: { params?: Record<string, any> }): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${INGREDIENTS}/${LIST}`, params })

  return response.data
}

export async function getPreparationTypeList(id: string | number): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${PREPARATIONS}/${INGREDIENTS}/${id}` })

  return response.data
}

export async function getIngredientDetail(id: string | number): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${INGREDIENTS}/${INGREDIENTS_DETAIL}/${id}` })

  return response.data
}

export async function updateIngredientStatus(id: string | number, payload?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({ url: `${DIET}/${INGREDIENTS}/${UPDATE_STATUS}/${id}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function deleteIngredient(id: string | number): Promise<any> {
  try {
    const response = await axiosPost({ url: `${DIET}/${INGREDIENTS}/${DELETE}/${id}` })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function getRecipeListonIngredientDtl(id: string | number, params?: Record<string, any>): Promise<any> {
  return await axiosGet({ url: `${DIET}/${RECIPE}/${RECIPE_LIST}/${id}`, params })
}

export async function getDietListonRecipeDtl(id: string | number, params?: Record<string, any>, type?: string): Promise<any> {
  return await axiosGet({ url: `${DIET}/${RECIPE_PARTOF_DIET_LIST}/${type}/${id}`, params })
}

export async function getDietListonIngredientDtl(id: string | number, params?: Record<string, any>): Promise<any> {
  return await axiosGet({ url: `${DIET}/${RECIPE_PARTOF_DIET_LIST}/${INGREDIENT}/${id}`, params })
}

export async function getDietActivityLogs(params?: Record<string, any>): Promise<any> {
  return await axiosGet({ url: `${REPARATION_ACTIVITY_LOGS}`, params })
}
