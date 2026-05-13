import { axiosFormPost as _axiosFormPost, axiosGet as _axiosGet } from '../../utility'

const axiosGet = _axiosGet as unknown as (opts: { url: string; params?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
const axiosFormPost = _axiosFormPost as unknown as (opts: { url: string; body?: unknown; pharmacy?: boolean }) => Promise<{ data: any }>
import type {
  ApiResponse,
  LabSampleListParams,
  LabSampleListResponse,
  LabSamplePayload,
  LabTestListParams,
  LabTestListResponse,
  LabTestPayload
} from 'src/types/lab'

export async function getLabSampleList({ params }: { params: LabSampleListParams }): Promise<LabSampleListResponse> {
  const url = `masters/list-sample-types`
  const response = await axiosGet({ url, params })

  return response.data
}

export async function getLabSampleListById(params: LabSampleListParams): Promise<LabSampleListResponse> {
  const url = `masters/list-sample-types`
  const response = await axiosGet({ url, params })

  return response.data
}

export async function addLabSample(payload: LabSamplePayload): Promise<ApiResponse> {
  try {
    const url = `masters/add-sample-types`
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

export async function updateLabSample(id: string | number, payload: LabSamplePayload): Promise<ApiResponse> {
  const url = `masters/edit-sample-types/${id}`
  try {
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

export async function deleteLabSample(id: string | number): Promise<ApiResponse> {
  const url = `masters/delete-sample-types/${id}`

  try {
    const response = await axiosFormPost({ url })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.error(axiosError.response.data)
    }

    return error as ApiResponse
  }
}

export async function getLabTestList({ params }: { params: LabTestListParams }): Promise<LabTestListResponse> {
  const url = `masters/list-lab-test`
  const response = await axiosGet({ url, params })

  return response.data
}

export async function getLabTestListById(params: LabTestListParams): Promise<LabTestListResponse> {
  const url = `masters/list-lab-test`
  const response = await axiosGet({ url, params })

  return response.data
}

export async function addLabTest(payload: LabTestPayload): Promise<ApiResponse> {
  try {
    const url = `masters/add-lab-test`
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

export async function updateLabTest(id: string | number, payload: LabTestPayload): Promise<ApiResponse> {
  const url = `masters/edit-lab-test/${id}`
  try {
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

export async function deleteLabTest(id: string | number): Promise<ApiResponse> {
  const url = `masters/delete-lab-test/${id}`
  try {
    const response = await axiosFormPost({ url })

    return response?.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { data: unknown; status: number; headers: unknown } }
    if (axiosError.response) {
      console.error(axiosError.response.data)
    }

    return error as ApiResponse
  }
}

export async function getLabTestListByParentChild(id: string | number, _payload?: unknown): Promise<ApiResponse> {
  const url = `masters/list-sample-types?id=${id}`
  const response = await axiosGet({ url })

  return response.data
}

export async function getLabTestDetailsById(params: { id?: string | number }): Promise<ApiResponse> {
  const url = `masters/detail-lab-test/${params?.id}`
  const response = await axiosGet({ url })

  return response.data
}
