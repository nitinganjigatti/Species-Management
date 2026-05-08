import { axiosPost as _axiosPost } from '../utility'

const axiosPost = _axiosPost as (params: { url: string; body?: unknown; pharmacy?: unknown }) => Promise<{ data: any }>

const SECTION_LISTING = 'zoos/section/listing'
const PARENT_CHILD_ENCLOSURE_LISTING = 'section/parentchild/enclosure/listing'

// ============== Sections =================

export interface SectionPickerItem {
  section_id: number
  section_name: string
  site_id?: number | null
  site_name?: string | null
  in_charge_name?: string | null
  enclosure_count?: number
  animal_count?: number
  section_image?: string | null
  [key: string]: unknown
}

export interface GetSectionsForPickerParams {
  zoo_id: number | string
  page?: number
  offset?: number
  selected_site_id?: number | string | null
  q?: string
  filter_empty_enclosures?: 0 | 1
  ignore_sys_gen?: 0 | 1
}

export async function getSectionsForPicker(params: GetSectionsForPickerParams): Promise<any> {
  const body = {
    zoo_id: params.zoo_id,
    page: params.page ?? 1,
    offset: params.offset ?? 20,
    selected_site_id: params.selected_site_id ?? null,
    q: params.q ?? '',
    filter_empty_enclosures: params.filter_empty_enclosures ?? 1,
    ignore_sys_gen: params.ignore_sys_gen ?? 1
  }
  const response = await axiosPost({ url: SECTION_LISTING, body })

  return response?.data
}

// ============== Enclosures (any level) =================

export interface EnclosurePickerItem {
  enclosure_id: number
  user_enclosure_name?: string
  enclosure_name?: string
  enclosure_image?: string | null
  // Real API field — returned as a string ("6") per the parent_child listing endpoint
  sub_enclosure_count?: string | number | null
  parent_enclosure_id?: number | null
  [key: string]: unknown
}

export interface GetEnclosuresForPickerParams {
  section_id: number | string
  parent_enclosure_id?: number | string | null
  page_no?: number
  q?: string
  ignore_sys_gen?: 0 | 1
}

export async function getEnclosuresForPicker(params: GetEnclosuresForPickerParams): Promise<any> {
  const body: Record<string, unknown> = {
    section_id: String(params.section_id),
    page_no: params.page_no ?? 1,
    ignore_sys_gen: params.ignore_sys_gen ?? 1
  }
  if (params.parent_enclosure_id != null) body.parent_enclosure_id = String(params.parent_enclosure_id)
  if (params.q !== undefined) body.q = params.q

  const response = await axiosPost({ url: PARENT_CHILD_ENCLOSURE_LISTING, body })

  return response?.data
}
