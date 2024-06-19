import { ORG_COUNT_LIST } from 'src/constants/ApiConstant'
import { axiosGet } from '../utility'

export async function getOrgCountList({ params }) {
  const response = await axiosGet({ url: `${ORG_COUNT_LIST}`, params })

  return response.data
}
