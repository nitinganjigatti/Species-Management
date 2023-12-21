import { GetLabNo, GetLabReport } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getNoOfLab() {
  const response = await axiosGet({ url: `${GetLabNo}` })

  return response.data
}

export async function GetLabReportById({ params }) {
  const response = await axiosGet({ url: `${GetLabReport}`, params })

  return response.data
}
