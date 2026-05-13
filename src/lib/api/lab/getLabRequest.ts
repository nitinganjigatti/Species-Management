import {
  GetLabNo,
  GetLabReport,
  RequestDetails,
  GetRequestPopUpById,
  PostTransfer,
  updateStatus,
  uploadLabReports,
  GetTestsStatusById,
  LabFileDelete,
  GETLABLISTBYTESTID
} from '../../../constants/ApiConstant'
import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet, axiosPost as _axiosPost } from '../utility'

const axiosGet = _axiosGet as unknown as (opts: { url: string; params?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
const axiosPost = _axiosPost as unknown as (opts: { url: string; body?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as unknown as (opts: { url: string; body?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
import type {
  ApiResponse,
  LabReportParams,
  LabReportResponse,
  RequestDetailsParams,
  RequestDetailsResponse,
  TransferLabPayload,
  UpdateStatusPayload,
  UploadLabReportsPayload,
  DeleteAttachmentParams,
  GetLabListByTestIdParams,
  BulkStatusPayload,
  BulkTransferPayload,
  CommentPayload
} from 'src/types/lab'

export async function getNoOfLab(): Promise<ApiResponse> {
  const response = await axiosGet({ url: `${GetLabNo}` })

  return response.data
}

export async function GetLabReportById({ params }: { params: LabReportParams }): Promise<LabReportResponse> {
  const response = await axiosGet({ url: `${GetLabReport}`, params })

  return response.data
}

export async function GetRequestDetails(
  id: string | number,
  { params }: { params: RequestDetailsParams }
): Promise<RequestDetailsResponse> {
  const response = await axiosGet({ url: `${RequestDetails}/${id}`, params })

  return response.data
}

export async function GetRequestPopUp(id: string | number): Promise<ApiResponse> {
  const response = await axiosGet({ url: `${GetRequestPopUpById}/${id}` })

  return response.data
}

export async function transferLab(id: string | number, payload: TransferLabPayload): Promise<ApiResponse> {
  try {
    const url = `${PostTransfer}/${id}`
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.info('Request made and server responded')
      console.error(axiosError.response.data)
      console.error(axiosError.response.status)
      console.error(axiosError.response.headers)
    }

    return error as ApiResponse
  }
}

export async function UpdateStatus(id: string | number, payload: UpdateStatusPayload): Promise<ApiResponse> {
  try {
    const url = `${updateStatus}/${id}`
    const response = await axiosPost({ url, body: payload })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.info('Request made and server responded')
      console.error(axiosError.response.data)
      console.error(axiosError.response.status)
      console.error(axiosError.response.headers)
    }

    return error as ApiResponse
  }
}

export async function UploadLabReports(payload: UploadLabReportsPayload): Promise<ApiResponse> {
  try {
    const url = `${uploadLabReports}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.info('Request made and server responded')
      console.error(axiosError.response.data)
      console.error(axiosError.response.status)
      console.error(axiosError.response.headers)
    }

    return error as ApiResponse
  }
}

export async function GetLabRequestTestStatusById({ params }: { params: Record<string, unknown> }): Promise<ApiResponse> {
  const response = await axiosGet({ url: `${GetTestsStatusById}`, params })

  return response.data
}

export async function DeleteLAbRequestAttachment(
  id: string | number,
  params: DeleteAttachmentParams
): Promise<ApiResponse> {
  try {
    const url = `medical/${id}/${LabFileDelete}?lab_test_id=${params?.lab_test_id}`
    const response = await axiosPost({ url })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.info('Request made and server responded')
      console.error(axiosError.response.data)
      console.error(axiosError.response.status)
      console.error(axiosError.response.headers)
    }

    return error as ApiResponse
  }
}

export async function GetLabListByTestId({ params }: { params: GetLabListByTestIdParams }): Promise<ApiResponse> {
  const response = await axiosGet({ url: `${GETLABLISTBYTESTID}`, params })

  return response.data
}

export async function getLabListByMultipleIds(
  id: string | number,
  params: GetLabListByTestIdParams
): Promise<ApiResponse> {
  const response = await axiosPost({ url: `antz/labs/bulk-assign-labs-list/${id}`, body: params })

  return response.data
}

export async function postBulkStatus({ params }: { params: BulkStatusPayload }): Promise<ApiResponse> {
  const response = await axiosPost({ url: `antz/bulk/update/tests/status`, body: params })

  return response.data
}

export async function postBulkTransfer({ params }: { params: BulkTransferPayload }): Promise<ApiResponse> {
  const response = await axiosPost({ url: `antz/labs/bulk-assign-labs-transfer`, body: params })

  return response.data
}

export async function postComment(id: string | number, params: CommentPayload): Promise<ApiResponse> {
  const response = await axiosPost({ url: `/medical/update-notes/${id}`, body: params })

  return response.data
}
