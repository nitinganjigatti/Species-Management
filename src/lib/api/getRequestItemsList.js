import { REQUEST_ITEMS, BATCH_DETAILS, DISPATCH, SHIPMENT } from '../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from './utility'

export async function getRequestItemsList({ params }) {
  const response = await axiosGet({ url: REQUEST_ITEMS, params })

  return response.data
}

export async function getRequestItemsListById(id) {
  const response = await axiosGet({ url: `${REQUEST_ITEMS}/${id}/show` })

  return response.data
}

//http://localhost:8080/api/batch-details/20

export async function getAvailableMedicineByMedicineId(id, data, store) {
  const response = await axiosGet({ url: `${BATCH_DETAILS}/${id}/${store}`, body: data })

  return response.data
}

export async function addDispatch(payload) {
  try {
    const url = `${DISPATCH}`
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

export async function getDispatchItemsByBatchId(id) {
  const response = await axiosGet({ url: `${DISPATCH}/${id}/show` })

  return response.data
}

export async function shipRequestedItems(payload) {
  try {
    const url = `${SHIPMENT}`
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

export async function getShippedItemsByRequestId(id) {
  const response = await axiosGet({ url: `${SHIPMENT}/${id}/show` })

  return response.data
}

// export async function getRequestItemsListById(id) {
//   const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${REQUEST_ITEMS}/${id}/edit`
//   console.log('url', url)

//   return axios
//     .get(url)
//     .then(response => {
//       console.log('response data', response)

//       return response.data.data
//     })
//     .catch(error => {
//       console.error(url)
//       if (error.response) {
//         console.info('Request made and server responded')
//         console.error(error.response.data)
//         console.error(error.response.status)
//         console.error(error.response.headers)
//       } else if (error.request) {
//         console.info('The request was made but no response was received')
//         console.error(error.request)
//       } else {
//         console.info('Something happened in setting up the request that triggered an Error')
//         console.error('Error', error.message)
//       }

//       return error

//       // throw new Error(error);
//     })
// }

export async function addRequestItems(payload) {
  try {
    const url = `${REQUEST_ITEMS}`
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

// export async function addRequestItems(payLoad) {
//   const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${REQUEST_ITEMS}`
//   console.log('url', url)

//   return axios
//     .post(url, payLoad)
//     .then(response => {
//       console.log('after adding items response data', response)

//       return response.data
//     })
//     .catch(error => {
//       console.error(url)
//       if (error.response) {
//         console.info('Request made and server responded')
//         console.error(error.response.data)
//         console.error(error.response.status)
//         console.error(error.response.headers)
//       } else if (error.request) {
//         console.info('The request was made but no response was received')
//         console.error(error.request)
//       } else {
//         console.info('Something happened in setting up the request that triggered an Error')
//         console.error('Error', error.message)
//       }

//       return error

//       // throw new Error(error);
//     })
// }
export async function updateRequestItems(id, payload) {
  try {
    const url = `${REQUEST_ITEMS}/${id}/update`
    var data = payload
    data.id = id

    // const response = await axiosPost({ url, body: data })
    const response = await axiosFormPost({ url, body: data })

    return response?.data
  } catch (error) {
    console.error(url)
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

// export async function updateRequestItems(id, payLoad) {
//   const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${REQUEST_ITEMS}/${id}/update`
//   console.log('url', url)

//   return axios
//     .post(url, payLoad)
//     .then(response => {
//       console.log('after updatateing items response data', response)

//       return response.data
//     })
//     .catch(error => {
//       console.error(url)
//       if (error.response) {
//         console.info('Request made and server responded')
//         console.error(error.response.data)
//         console.error(error.response.status)
//         console.error(error.response.headers)
//       } else if (error.request) {
//         console.info('The request was made but no response was received')
//         console.error(error.request)
//       } else {
//         console.info('Something happened in setting up the request that triggered an Error')
//         console.error('Error', error.message)
//       }

//       return error

//       // throw new Error(error);
//     })
// }
