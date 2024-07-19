import { ADD, EDIT, EGG, INCUBATOR, LIST, NURSERY } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getAllStats(params) {
  return await axiosGet({
    url: `${EGG}/get-all-stats`,
    params: params
  })
}
export async function getTodaysCollection() {
  return await axiosGet({
    url: `${EGG}/egg-stats`
  })
}

export async function getTransferList(params) {
  return await axiosGet({
    url: `${EGG}/get-transfer-egg-list`,
    params: params
  })
}

export async function getSpeciesList(params) {
  return await axiosGet({
    url: `${EGG}/get-species-list`,
    params: params
  })
}

export async function getSiteList(params) {
  return await axiosGet({
    url: `${EGG}/species-wise-details`,
    params: params
  })
}
// export async function addIncubator(payload) {
//   try {
//     const response = await axiosPost({ url: `${EGG}/${NURSERY}/${INCUBATOR}/${ADD}`, body: payload })

//     return response?.data
//   } catch (error) {
//     if (error.response) {
//       console.info('Request made and server responded')
//       console.error(error.response.data)
//       console.error(error.response.status)
//       console.error(error.response.headers)
//     }

//     return error
//   }
// }

// export async function updateIncubator(id, payload) {
//   try {
//     const response = await axiosPost({ url: `${EGG}/${NURSERY}/${INCUBATOR}/${id}/${EDIT}`, body: payload })

//     return response?.data
//   } catch (error) {
//     if (error.response) {
//       console.info('Request made and server responded')
//       console.error(error.response.data)
//       console.error(error.response.status)
//       console.error(error.response.headers)
//     }

//     return error
//   }
// }
