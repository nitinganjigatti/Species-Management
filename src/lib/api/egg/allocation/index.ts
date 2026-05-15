import { axiosFormPost, axiosGet } from '../../utility'
import { ASSESMENT_TYPES, EGG } from 'src/constants/ApiConstant'

export async function GetAssesmentTypes(): Promise<any> {
  const response = await axiosGet({ url: `${ASSESMENT_TYPES}`, pharmacy: true })
  return response.data
}

export async function AddAllocation(params?: Record<string, any>): Promise<any> {
  const response = await axiosFormPost({ url: `${EGG}/allocate`, body: params, pharmacy: true })
  return response.data
}
