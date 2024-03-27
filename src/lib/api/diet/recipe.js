import { DETAILS, DIET, RECIPES } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getRecipeDetail(id) {
  return await axiosGet({ url: `${DIET}/${RECIPES}/${DETAILS}/${id}` })
}
