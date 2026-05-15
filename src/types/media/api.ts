export interface GetMediaParams {
  userId: string | number | undefined
  q?: string
  page?: number
}

export interface UploadMediaPayload {
  user_id: string | number | undefined
  user_attachment: File
}
