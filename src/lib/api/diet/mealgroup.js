import {
  ADD_ENCLOSURE,
  ADD_DROP_POINT,
  CREATE_DROP_POINT,
  CREATE_GROUP,
  EDIT_DROP_POINT,
  GET_DROP_POINT_LIST,
  GET_ENCLOSURE_LIST,
  GET_ENCLOSURELIST,
  GET_GROUPLIST,
  GET_SECTION,
  GET_SPECIES,
  GET_STATS,
  REMOVE_MEAL_GROUP,
  REMOVE_MEAL_GROUP_FROM_DROP_POINT,
  UPDATE_GROUP
} from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility' 

export async function getEnclosureList(params) {
  const response = await axiosGet({ url: `${GET_ENCLOSURELIST}`, params }) 

  return response.data 
}

export async function createMealGroup(payload) {
  const response = await axiosPost({ url: `${CREATE_GROUP}`, body: payload })

  return response.data
}

export async function updateMealGroup(payload) {

  const response = await axiosPost({ url: `${UPDATE_GROUP}`, body: payload })

  return response.data
}

export async function getMealGroupStats(params) {
  const response = await axiosGet({ url: `${GET_STATS}`, params })

  return response.data
}

export async function getSectionList(params) {

  const response = await axiosPost({ url: `${GET_SECTION}`, body: params })

  return response.data 
}

export async function getSpeciesList(params) {

  const response = await axiosGet({ url: `${GET_SPECIES}`, params })

  return response.data
}

export async function getMealGroupList(params) {
  const response = await axiosGet({ url: `${GET_GROUPLIST}`, params })

  return response.data
}

export async function removeMealGroup(payload) {
  const response = await axiosPost({ url: `${REMOVE_MEAL_GROUP}`, body: payload })

  return response.data
}

export async function getEnclosureListByGroup(params) {
  const response = await axiosGet({ url: `${GET_ENCLOSURE_LIST}`, params })

  return response.data
}

export async function AddEnclosureToExistng(payload) {
  const response = await axiosPost({ url: `${ADD_ENCLOSURE}`, body: payload })

  return response.data
}

export async function addDropPointToMealGroup(payload) {
  const response = await axiosPost({ url: `${ADD_DROP_POINT}`, body: payload })

  return response.data
}

export async function getDropPointList(params) {
  const response = await axiosGet({ url: `${GET_DROP_POINT_LIST}`, params })

  return response.data
}

export async function removeMealGroupFromDropPoint(payload) {
  const response = await axiosPost({ url: `${REMOVE_MEAL_GROUP_FROM_DROP_POINT}`, body: payload })

  return response.data
}

export async function createDropPoint(payload) {
  const response = await axiosPost({ url: `${CREATE_DROP_POINT}`, body: payload })

  return response.data
}

export async function editDropPoint(payload) {
  const response = await axiosPost({ url: `${EDIT_DROP_POINT}`, body: payload })

  return response.data
}
