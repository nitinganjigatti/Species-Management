import { axiosFormPost, axiosGet } from '../../utility'

import { ASSESMENT_TYPES, EGG } from 'src/constants/ApiConstant'

// export async function GetMasterList() {
//   const response = await axiosGet({ url: `${MASTER_DATA}`, pharmacy: true })

//   return response.data
// }

export async function GetAssesmentTypes() {
  const response = await axiosGet({ url: `${ASSESMENT_TYPES}`, pharmacy: true })

  return response.data
}

export async function AddAllocation(params) {
  const response = await axiosFormPost({ url: `${EGG}/allocate`, body: params, pharmacy: true })

  return response.data
}
