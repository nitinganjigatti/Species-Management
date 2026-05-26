import { ADD, EDIT, EGG, INCUBATOR, LIST, NURSERY, DASHBOARD_DISCARD, DASHBOARD_BATCH } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getAllStats(params?: Record<string, any>): Promise<any> {
  return await axiosGet({
    url: `${EGG}/get-all-stats`,
    params: params
  })
}

export async function getTodaysCollection(): Promise<any> {
  return await axiosGet({
    url: `${EGG}/egg-stats`
  })
}

export async function getTransferList(params?: Record<string, any>): Promise<any> {
  return await axiosGet({
    url: `${EGG}/get-transfer-egg-list`,
    params: params
  })
}

export async function getSpeciesList(params?: Record<string, any>): Promise<any> {
  return await axiosGet({
    url: `${EGG}/get-species-list`,
    params: params
  })
}

export async function getSiteList(params?: Record<string, any>): Promise<any> {
  return await axiosGet({
    url: `housing-list-for-egg`,
    params: params
  })
}

export async function getDashboardDiscardList(params?: Record<string, any>): Promise<any> {
  return await axiosGet({
    url: `${EGG}/${DASHBOARD_DISCARD}`,
    params: params
  })
}

export async function getFilterBatchList(params?: Record<string, any>): Promise<any> {
  return await axiosGet({
    url: `${EGG}/${DASHBOARD_BATCH}`,
    params: params
  })
}
