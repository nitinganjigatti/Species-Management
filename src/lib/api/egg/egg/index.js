import { axiosFormPost, axiosGet } from '../../utility'
import { EGG, LIST } from 'src/constants/ApiConstant'

export async function GetEggList({ params }) {
  const response = await axiosGet({ url: `${EGG}/detail/${LIST}`, params: params, pharmacy: true })

  return response.data
}
