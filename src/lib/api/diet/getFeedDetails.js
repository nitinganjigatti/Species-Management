import { FEED_DETAILS, INGREDIENTS_LIST, FEED } from '../../../constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getFeedDetails() {
  return await axiosGet({ url: `${FEED_DETAILS}/2` })
}

export async function getIngredientsOnFeed() {
  return await axiosGet({ url: `${FEED}/${INGREDIENTS_LIST}/2` })
}
