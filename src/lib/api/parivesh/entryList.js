import { DELETE_ATTACHMENT_FOR_ANIMAL, ENTRY_LIST_SPECIES } from '../../../constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getEntryList({ params }) {
  const response = await axiosGet({ url: `${ENTRY_LIST_SPECIES}`, params })

  return response.data
}

export async function getEntryListById(params) {
  const response = await axiosGet({ url: `${ENTRY_LIST_SPECIES}`, params })

  return response.data
}

export async function deleteAttachment(id, payload) {
  // const attachment = `v1/parivesh/species/site/deleteattachmentforanimal`
  try {
    const url = `${DELETE_ATTACHMENT_FOR_ANIMAL}/${id}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
