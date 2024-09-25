import { axiosFormPost, axiosGet, axiosPost } from '../../utility'
import {
  ADD,
  COMMENT,
  DELETE,
  EGG,
  LIST,
  DISCARD,
  STATUS,
  UPDATE,
  NECROPSY_REPORTS,
  GET_COLLECTED_BY
} from 'src/constants/ApiConstant'

export async function GetEggList({ params }) {
  const response = await axiosGet({ url: `${EGG}/detail/${LIST}`, params: params })

  return response.data
}

export async function GetEggDetails(id) {
  const response = await axiosGet({ url: `${EGG}/${id}` })

  return response.data
}

export async function GetEggMaster() {
  const response = await axiosGet({ url: `${EGG}/master/data/all` })

  return response.data
}

export async function getGalleryImgList(params) {
  const response = await axiosGet({ url: `${EGG}/get-media-by-egg-id`, params })

  return response.data
}

export async function getWeightList(params) {
  const response = await axiosGet({ url: `${EGG}/assessment/list`, params })

  return response.data
}

export async function getActivityLogs(id, params) {
  const response = await axiosGet({ url: `${EGG}/history/${id}`, params })

  return response.data
}

//Not in use

// export async function AddToDiscard(payload) {
//   try {
//     const url = `${EGG}/${DISCARD}/${ADD}`
//     var data = payload
//     const response = await axiosFormPost({ url, body: data })

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

export async function getEggComments(params) {
  const response = await axiosGet({ url: `${EGG}/${COMMENT}-${LIST}`, params })

  return response.data
}

export async function addEggComment(payload) {
  try {
    const response = await axiosPost({ url: `${EGG}/${ADD}-${COMMENT}`, body: payload })

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

export async function deleteEggComments(params) {
  const response = await axiosGet({ url: `${EGG}/${COMMENT}-${DELETE}`, params })

  return response.data
}

export async function AddEggStatusAndCondition(payload) {
  try {
    const url = `${EGG}/${STATUS}/${UPDATE}`
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

export async function getDefaultEggAssesment() {
  const response = await axiosGet({ url: `${EGG}/default_assessment_types` })

  return response.data
}

export async function AddAssesment(params) {
  try {
    const response = await axiosPost({
      url: `${EGG}/add-assessment`,
      body: params
    })

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

export async function AddEggNecropsy(payload) {
  try {
    const url = `${EGG}/${NECROPSY_REPORTS}/${ADD}`
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

export async function getCollectedByList({ params }) {
  return await axiosGet({
    url: `${EGG}/${GET_COLLECTED_BY}`,
    params: params
  })
}

export async function transferEggToIncubator(payload) {
  try {
    const response = await axiosPost({ url: `${EGG}/transfer/incubator`, body: payload })

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

export async function transferIncubatorToRoom(params) {
  try {
    const response = await axiosPost({
      url: `${EGG}/incubator-room-change?incubator_id=${params?.incubator_id}&to_room_id=${params?.to_room_id}`
    })

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

export async function EditEgg(payload) {
  try {
    const url = `${EGG}/edit/identifier`
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
