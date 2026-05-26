import { Id } from '../../models'

export interface ZooWiseSiteListParams {
  q?: string
  limit?: number
  page_no?: number
}

export interface ZooWiseSiteItem {
  site_id: Id
  site_name: string
}

export interface ZooWiseSiteListResponse {
  success?: boolean
  data?: {
    result?: ZooWiseSiteItem[]
  }
  message?: string
}

export interface SiteOption {
  value: Id
  label: string
}
