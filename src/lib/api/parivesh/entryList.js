import { ENTRY_LIST_SPECIES } from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getEntryList({ params }) {
  const response = await axiosGet({ url: `${ENTRY_LIST_SPECIES}`, params })

  return response.data
}
