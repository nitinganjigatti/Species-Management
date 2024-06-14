import { LISTING, DIET, UPDATE_STATUS, DETAILS, DELETE, TYPE, ADD, UPDATE } from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet } from '../utility'

export async function getDietList({ params }) {
  const response = await axiosGet({ url: `${DIET}/${LISTING}`, params })

  return response.data
}

export async function getDietDetails(id, params) {
  const response = await axiosGet({ url: `${DIET}/${DETAILS}/${id}`, params })

  return response.data
}

export async function dietStatusChange(payload, id) {
  try {
    const url = `${DIET}/${UPDATE_STATUS}/${id}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getDietTypeList(params) {
  const response = await axiosGet({ url: `${DIET}/${TYPE}/${LISTING}`, params })

  return response.data
}

export async function deleteDiet(id) {
  try {
    const url = `${DIET}/${DELETE}/${id}`
    const response = await axiosFormPost({ url })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function addNewDiet(payload) {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${ADD}`, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function updateDiet(id, payload) {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${UPDATE}/${id}`, body: payload })

    return response?.data
  } catch (error) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}
