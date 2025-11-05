import {
  APPLY_PARAMS_TO_CASE_ID,
  GET_HOSPITAL_PARAMS_TEMPLATE,
  GET_PARAMETERS_ON_FILTERS,
  GET_PARAMS_FILER_OPTIONS,
  GET_PARAMS_OF_TEMPLATE,
  GET_TREATMENT_PARAMETERS_INTERVALS,
  SAVE_HOSPITAL_TEMPLATE,
  SCHEDULE_INTERVALS_FOR_PARAMETERS
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export const getTreatmentIntervals = async () => {
  const response = await axiosGet({ url: `${GET_TREATMENT_PARAMETERS_INTERVALS}` })

  return response?.data
}

export const addIntervalsForParameters = async payload => {
  const response = await axiosPost({ url: `${SCHEDULE_INTERVALS_FOR_PARAMETERS}`, body: payload })

  return response?.data
}

export const getHospitalParamsFilterOptions = async params => {
  const response = await axiosGet({ url: `${GET_PARAMS_FILER_OPTIONS}`, params })

  return response?.data
}

export const getParametersBasedOnFilters = async params => {
  const response = await axiosGet({ url: `${GET_PARAMETERS_ON_FILTERS}`, params })

  return response?.data
}

export const getHospitalParamsTemplatesList = async params => {
  const response = await axiosGet({ url: `${GET_HOSPITAL_PARAMS_TEMPLATE}`, params })

  return response?.data
}

export const getParametersBasedOnTemplates = async params => {
  const response = await axiosGet({ url: `${GET_PARAMS_OF_TEMPLATE}`, params })

  return response?.data
}

export const saveHospitalTemplate = async params => {
  const response = await axiosFormPost({ url: `${SAVE_HOSPITAL_TEMPLATE}`, body: params })

  return response?.data
}

export const applyParamsToHospitalCaseId = async params => {
  const response = await axiosFormPost({ url: `${APPLY_PARAMS_TO_CASE_ID}`, body: params })

  return response?.data
}
