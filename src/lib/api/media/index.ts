import { axiosFormPost, axiosGet, fetchFormPostMedia } from 'src/lib/api/utility'
import type { GetMediaParams, UploadMediaPayload } from 'src/types/media'

export type { MediaItem, MediaGroup } from 'src/types/media'

export async function getMediaListById({ params }: { params: GetMediaParams }) {
  const url = `user/${params?.userId}/media`
  const response = await axiosGet({ url, params })

  return response.data
}

export async function uploadMediaFile(payload: UploadMediaPayload) {
  try {
    const url = `user/media/uploads`
    const response = await fetchFormPostMedia({ url, body: payload })

    return response
  } catch (error: unknown) {
    return error
  }
}

export async function deleteMediaFile(id: number | string) {
  try {
    const url = `/user/media/${id}/delete`
    const response = await axiosFormPost({ url })

    return response?.data
  } catch (error: unknown) {
    return error
  }
}
