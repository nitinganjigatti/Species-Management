import { ADD, EDIT, EGG, INCUBATOR, LIST, NURSERY } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getIncubatorList({
  params
}: {
  params?: Record<string, any>
}): Promise<any> {
  return await axiosGet({
    url: `${EGG}/${NURSERY}/${INCUBATOR}/${LIST}`,
    params: params
  })
}

export async function getAvailibilityList(): Promise<any> {
  return await axiosGet({
    url: `incubator-availability-types`
  })
}

export async function getIncubatorDetail(id: string | number): Promise<any> {
  return await axiosGet({ url: `${EGG}/${NURSERY}/${INCUBATOR}/${id}` })
}

export async function addIncubator(payload: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({ url: `${EGG}/${NURSERY}/${INCUBATOR}/${ADD}`, body: payload })
    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }
    return error
  }
}

export async function updateIncubator(id: string | number, payload: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({
      url: `${EGG}/${NURSERY}/${INCUBATOR}/${id}/${EDIT}`,
      body: payload
    })
    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }
    return error
  }
}
