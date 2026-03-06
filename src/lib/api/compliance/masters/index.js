import {
  GET_DOCUMENT_TYPE_LIST,
  CREATE_DOCUMENT_TYPE,
  UPDATE_DOCUMENT_TYPE,
  GET_TRADE_CONTEXT_TYPE,
  GET_TRADE_PARTIES_LIST
} from 'src/constants/ApiConstant'

import { axiosGet, axiosPost } from '../../utility'

export async function getDocumentTypeList(params) {
  const response = await axiosGet({
    url: `${GET_DOCUMENT_TYPE_LIST}`,
    params
  })

  return response.data
}

export async function getMasterImports(params) {
  const response = await axiosGet({
    url: `${GET_TRADE_PARTIES_LIST}`,
    params
  })
  
return response.data
}

export async function createTradeParties(payload) {
  try {
    const url = `${GET_TRADE_PARTIES_LIST}`
    const response = await axiosPost({ url, body: payload })

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

export async function updateTradeParties(id, payload) {
  try {
    const url = `${GET_TRADE_PARTIES_LIST}/update/${id}`
    const response = await axiosPost({ url, body: payload })

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

export async function deleteTradeParties(id) {
  try {
    const url = `${GET_TRADE_PARTIES_LIST}/delete/${id}`
    const response = await axiosGet({ url })
    
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

export async function addDocumentType(payload) {
  try {
    const url = `${CREATE_DOCUMENT_TYPE}`
    const response = await axiosPost({ url, body: payload })

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

export async function updateDocumentType(id, payload) {
  try {
    const url = `${UPDATE_DOCUMENT_TYPE}/${id}`
    const response = await axiosPost({ url, body: payload })

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

export async function getTradeContextTypes() {
  try {
    const response = await axiosGet({
      url: `${GET_TRADE_CONTEXT_TYPE}`
    })

    return response.data
  } catch (error) {
    console.error('Error fetching trade context types:', error)

    return error
  }
}
