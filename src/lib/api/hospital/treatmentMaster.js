import { GET_TREATMENT_MASTER_LIST, CREATE_TREATMENT, GET_TREATMENT_LIST, UPDATE_TREATMENT } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export const getTreatmentMasterList = async ({ q = '', page = 0, limit = 10 } = {}) => {
  try {
    const response = await axiosGet({
      url: GET_TREATMENT_MASTER_LIST,
      params: { q, page, limit }
    })

    return response?.data
  } catch (error) {
    console.error('Error fetching treatment master list:', error?.message || error)
    throw error
  }
}

export const createTreatmentRecord = async payload => {
  try {
    const formData = new FormData()

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })

    const response = await axiosFormPost({
      url: CREATE_TREATMENT,
      body: formData
    })

    return response?.data
  } catch (error) {
    console.error('Error creating treatment:', error?.message || error)
    throw error
  }
}

export const getTreatmentList = async (params = {}) => {
  try {
    const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }

      return acc
    }, {})

    const response = await axiosGet({
      url: GET_TREATMENT_LIST,
      params: filteredParams
    })

    return response?.data
  } catch (error) {
    console.error('Error fetching treatment list:', error?.message || error)
    throw error
  }
}

export const updateTreatmentRecord = async payload => {
  try {
    const formData = new FormData()

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })

    const response = await axiosFormPost({
      url: UPDATE_TREATMENT,
      body: formData
    })

    return response?.data
  } catch (error) {
    console.error('Error updating treatment:', error?.message || error)
    throw error
  }
}
