import { REQUEST_ITEMS } from '../../constants/ApiConstant'
import { axiosGet, axiosPost } from './utility'

export async function getRequestItemsList() {
  const response = await axiosGet({ url: REQUEST_ITEMS })

  return response.data.data
}

export async function getRequestItemsListById(id) {
  const response = await axiosGet({ url: `${REQUEST_ITEMS}/${id}/edit` })

  return response.data.data
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
    const response = await axiosPost({ url, body: data })

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
