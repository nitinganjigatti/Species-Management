export interface MediaItem {
  id: number | string
  file_original_name: string
  user_media: string
  file_type: string
  created_at: string
}

export interface MediaGroup {
  date: string
  media: MediaItem[]
}
