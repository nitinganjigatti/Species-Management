import { axiosGet, axiosPost, axiosDelete, GetAPIHeader } from 'src/lib/api/utility'
import { VMS_ENDPOINTS } from 'src/constants/vms'
import axios from 'axios'
import type {
  VmsPassListParams,
  VmsPassListResponse,
  VmsPass,
  CreatePassPayload,
  ScanPayload,
  ScanResponse,
  VmsMasterGadget,
  CreateGadgetPayload,
  VmsReportSummary,
  VmsReportFilters,
  VmsApiResponse,
} from 'src/types/vms'

// --- Passes ---

export const getPassesList = async (params: VmsPassListParams): Promise<VmsPassListResponse> => {
  const response = await axiosGet({ url: VMS_ENDPOINTS.PASSES_LIST, params, pharmacy: false })

  return response?.data
}

export const getPassDetail = async (id: string): Promise<VmsApiResponse<VmsPass>> => {
  const response = await axiosGet({ url: VMS_ENDPOINTS.PASS_DETAIL(id), params: {}, pharmacy: false })

  return response?.data
}

export const searchPasses = async (q: string): Promise<VmsApiResponse<VmsPass[]>> => {
  const response = await axiosGet({ url: VMS_ENDPOINTS.PASSES_SEARCH, params: { q }, pharmacy: false })

  return response?.data
}

export const getPassQr = async (id: string): Promise<VmsApiResponse<{ qr_code: string }>> => {
  const response = await axiosGet({ url: VMS_ENDPOINTS.PASS_QR(id), params: {}, pharmacy: false })

  return response?.data
}

export const createPass = async (payload: CreatePassPayload): Promise<VmsApiResponse<VmsPass>> => {
  const response = await axiosPost({ url: VMS_ENDPOINTS.CREATE_PASS, body: payload, pharmacy: false })

  return response?.data
}

export const updatePass = async (
  id: string,
  payload: Partial<CreatePassPayload>
): Promise<VmsApiResponse<VmsPass>> => {
  const headers: any = await GetAPIHeader({ pharmacy: false })
  headers['Content-Type'] = 'application/json'
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${VMS_ENDPOINTS.UPDATE_PASS(id)}`

  const response = await axios.put(completeUrl, payload, { headers })

  return response?.data
}

export const cancelPass = async (id: string): Promise<VmsApiResponse<null>> => {
  const response = await axiosDelete({ url: VMS_ENDPOINTS.CANCEL_PASS(id), params: {}, pharmacy: false })

  return response?.data
}

// --- Scan ---

export const scanQr = async (payload: ScanPayload): Promise<VmsApiResponse<ScanResponse>> => {
  const response = await axiosPost({ url: VMS_ENDPOINTS.SCAN, body: payload, pharmacy: false })

  return response?.data
}

// --- Gadgets ---

export const getGadgetsList = async (): Promise<VmsApiResponse<VmsMasterGadget[]>> => {
  const response = await axiosGet({ url: VMS_ENDPOINTS.GADGETS_LIST, params: {}, pharmacy: false })

  return response?.data
}

export const createGadget = async (
  payload: CreateGadgetPayload
): Promise<VmsApiResponse<VmsMasterGadget>> => {
  const response = await axiosPost({ url: VMS_ENDPOINTS.CREATE_GADGET, body: payload, pharmacy: false })

  return response?.data
}

export const updateGadget = async (
  id: number,
  payload: Partial<CreateGadgetPayload>
): Promise<VmsApiResponse<VmsMasterGadget>> => {
  const headers: any = await GetAPIHeader({ pharmacy: false })
  headers['Content-Type'] = 'application/json'
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${VMS_ENDPOINTS.UPDATE_GADGET(id)}`

  const response = await axios.put(completeUrl, payload, { headers })

  return response?.data
}

export const deleteGadget = async (id: number): Promise<VmsApiResponse<null>> => {
  const response = await axiosDelete({ url: VMS_ENDPOINTS.DELETE_GADGET(id), params: {}, pharmacy: false })

  return response?.data
}

// --- Reports ---

export const getReportSummary = async (
  filters: VmsReportFilters
): Promise<VmsApiResponse<VmsReportSummary>> => {
  const response = await axiosGet({ url: VMS_ENDPOINTS.REPORT_SUMMARY, params: filters, pharmacy: false })

  return response?.data
}

export const getReportVisitors = async (
  filters: VmsReportFilters
): Promise<VmsApiResponse<VmsPass[]>> => {
  const response = await axiosGet({
    url: VMS_ENDPOINTS.REPORT_VISITORS,
    params: filters,
    pharmacy: false,
  })

  return response?.data
}

export const exportReportCsv = async (
  filters: VmsReportFilters
): Promise<Blob> => {
  const headers = await GetAPIHeader({ pharmacy: false })
  const completeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${VMS_ENDPOINTS.REPORT_EXPORT}`

  const response = await axios.get(completeUrl, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    params: { ...filters, format: 'csv' },
    responseType: 'blob',
  })

  return response.data
}

export const exportReportPdfData = async (
  filters: VmsReportFilters
): Promise<VmsApiResponse<{ type: string; data: VmsPass[] }>> => {
  const response = await axiosGet({
    url: VMS_ENDPOINTS.REPORT_EXPORT,
    params: { ...filters, format: 'pdf' },
    pharmacy: false,
  })

  return response?.data
}
