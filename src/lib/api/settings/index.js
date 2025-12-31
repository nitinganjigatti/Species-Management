import { axiosGet, axiosPost, axiosDelete } from '../utility'

export async function getJobStats(params) {
  const response = await axiosGet({ url: 'v1/jobs/stats', params })

  return response.data
}

export async function getJobsList(params) {
  const response = await axiosGet({ url: 'v1/jobs', params })

  return response.data
}

export async function cancelJob(jobId) {
  const response = await axiosDelete({ url: `v1/jobs/${jobId}` })

  return response.data
}

export async function triggerJob(jobId) {
  const response = await axiosPost({ url: `v1/jobs/${jobId}/process` })

  return response.data
}

export async function createJobRequest(data) {
  const response = await axiosPost({ url: 'v1/jobs/request', body: data })

  return response.data
}
