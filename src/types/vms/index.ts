export interface VmsPass {
  pass_id: string
  zoo_id: number
  visitor_name: string
  visitor_contact: string
  department: string
  purpose_of_visit: string
  start_date: string
  end_date: string
  time_in: string | null
  time_out: string | null
  gadgets_text: string | null
  remarks: string | null
  qr_code: string | null
  status: 'active' | 'checked_in' | 'checked_out' | 'expired' | 'cancelled'
  created_by: number
  created_on_behalf_of: number | null
  created_at: string
  modified_at: string
  modified_by: number | null
  created_by_name: string
  on_behalf_of_name?: string | null
  sites?: VmsPassSite[]
  gadgets?: VmsPassGadget[]
}

export interface VmsPassSite {
  site_id: number
  site_name: string
  site_image?: string
}

export interface VmsPassGadget {
  gadget_id: number
  gadget_name: string
  fields: string | GadgetFieldConfig[]
  quantity: number
  serial_key: string | null
  color: string | null
  model: string | null
  make: string | null
  imei: string | null
  custom_fields: string | Record<string, any> | null
}

export interface GadgetFieldConfig {
  key: string
  required: boolean
  label?: string
  type?: 'text' | 'number' | 'date'
  _gadget_name?: string
}

export interface VmsMasterGadget {
  gadget_id: number
  gadget_name: string
  fields: GadgetFieldConfig[]
  zoo_id: number
}

export interface VmsPassListResponse {
  success: boolean
  data: VmsPass[]
  total: number
  page_no: number
  limit: number
  message: string
}

export interface VmsPassListParams {
  page_no?: number
  limit?: number
  status?: string
  start_date?: string
  end_date?: string
  site_id?: number
}

export interface CreatePassPayload {
  visitor_name: string
  visitor_contact: string
  department: string
  purpose_of_visit: string
  start_date: string
  end_date: string
  site_ids: number[]
  gadgets?: CreatePassGadget[]
  gadgets_text?: string
  remarks?: string
  created_on_behalf_of?: number | null
}

export interface CreatePassGadget {
  gadget_id: number
  quantity: number
  serial_key?: string | null
  imei?: string | null
  make?: string | null
  model?: string | null
  color?: string | null
  custom_fields?: Record<string, any> | null
}

export interface ScanPayload {
  qr_data: string
  site_id?: number | null
}

export interface ScanResponse {
  scan_type: 'entry' | 'exit'
  pass: VmsPass
}

export interface VmsReportSummary {
  total_visitors: number
  by_status: { status: string; count: string }[]
  by_day: { date: string; count: string }[]
  peak_hours: { hour: string; count: string }[]
  top_sites: { site_id: number; site_name: string; count: string }[]
}

export interface VmsReportFilters {
  start_date?: string
  end_date?: string
  status?: string
  site_id?: number
}

export interface CreateGadgetPayload {
  gadget_name: string
  fields: GadgetFieldConfig[]
}

// API response wrapper
export interface VmsApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}
