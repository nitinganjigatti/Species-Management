import { AddLAB, GetLab, AllLabSample, LabEditGetById, UpdateLab } from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

export async function addLab(payload) {
  try {
    const url = `${AddLAB}`
    var data = payload
    const response = await axiosFormPost({ url, body: data })

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

export async function getLabList({ params }) {
  const response = await axiosGet({ url: `${GetLab}`, params })

  return response.data
}

// export async function getAllLabSample({ params }) {
//   const response = await axiosGet({ url: `${AllLabSample}`, params })

//   return response.data
// }

export async function getAllLabSample() {
  const response = await axiosGet({ url: AllLabSample })

  return response.data.data
}

export async function getLabDeatilsById(id) {
  const response = await axiosGet({ url: `${LabEditGetById}${id}` })

  return response.data
}

export async function updateLabById(payload, id) {
  try {
    const url = `${UpdateLab}${id}`
    var data = payload
    data.id = id
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    // console.error(url)
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}
