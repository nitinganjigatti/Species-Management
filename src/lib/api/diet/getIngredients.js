import { INGREDIENT_LIST } from '../../../constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getIngredientList({ params }) {
  const response = await axiosGet({ url: `${INGREDIENT_LIST}`, params })

  return response.data
}
