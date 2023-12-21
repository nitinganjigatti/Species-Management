import { DEBIT_NOTE } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost } from '../utility'

export async function getDebitNote() {
  const response = await axiosGet({ url: DEBIT_NOTE })

  return response.data.data
}

export async function getDebitListById(id) {
  const response = await axiosGet({ url: `${DEBIT_NOTE}/${id}/show` })

  return response.data
}

export async function addDebit(payload) {
  try {
    const url = `${DEBIT_NOTE}`
    var data = payload
    const response = await axiosPost({ url, body: data })

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

export async function updateDebit(id, payload) {
  try {
    const url = `${DEBIT_NOTE}/${id}/update`
    var data = payload
    data.id = id
    const response = await axiosPost({ url, body: data })

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
