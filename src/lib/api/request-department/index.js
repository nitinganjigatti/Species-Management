import { axiosGet, axiosPost, axiosFormPost } from '../utility'
import {
  REQUEST_DEPARTMENTS,
  REQUEST_DEPARTMENT,
  REQUEST_DEPARTMENT_USERS,
  REQUEST_LIST
} from 'src/constants/ApiConstant'

export async function getDepartments(params) {
  const response = await axiosGet({ url: REQUEST_DEPARTMENTS, params })
  return response.data
}

export async function getDepartmentById(id) {
  const response = await axiosGet({ url: `${REQUEST_DEPARTMENT}/${id}` })
  return response.data
}

export async function createDepartment(payload) {
  const response = await axiosFormPost({ url: REQUEST_DEPARTMENTS, body: payload })
  return response?.data
}

export async function updateDepartment(id, payload) {
  const response = await axiosFormPost({ url: `${REQUEST_DEPARTMENTS}/${id}`, body: payload })
  return response?.data
}

export async function getDepartmentUsers(deptId, params) {
  const response = await axiosGet({ url: `${REQUEST_DEPARTMENT_USERS}/${deptId}`, params })
  return response.data
}

export async function assignDepartmentUser(payload) {
  const response = await axiosPost({ url: REQUEST_DEPARTMENT_USERS, body: payload })
  return response?.data
}

export async function updateDepartmentUser(userId, payload) {
  const response = await axiosPost({ url: `${REQUEST_DEPARTMENT_USERS}/${userId}`, body: payload })
  return response?.data
}

export async function getDepartmentRequests(params) {
  const response = await axiosGet({ url: REQUEST_LIST, params })
  return response.data
}

export async function getDepartmentVendors(departmentId, params) {
  const response = await axiosGet({ url: 'v1/vendor/mappings/list', params: { department_id: departmentId, ...params } })
  return response.data
}

export async function assignVendorsToDepartment(payload) {
  const response = await axiosPost({ url: `${REQUEST_DEPARTMENT}/vendors`, body: payload })
  return response?.data
}

export async function removeVendorFromDepartment(payload) {
  const response = await axiosPost({ url: 'v1/vendor/mappings/remove', body: payload })
  return response?.data
}
