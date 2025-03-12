import { ADD, EDIT, EGG, INCUBATOR, LIST, NURSERY } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getIncubatorList({ params }) {
  return await axiosGet({
    url: `${EGG}/${NURSERY}/${INCUBATOR}/${LIST}`,
    params: params
  })
}

export async function getAvailibilityList() {
  return await axiosGet({
    url: `incubator-availability-types`
  })
}

export async function getIncubatorDetail(id) {
  return await axiosGet({ url: `${EGG}/${NURSERY}/${INCUBATOR}/${id}` })
}

//   export async function getUnitsForIngredient({ params }) {
//     const response = await axiosGet({ url: `${DIET}/${UOM}/${LIST}`, params })

//     return response.data
//   }

export async function addIncubator(payload) {
  try {
    const response = await axiosPost({ url: `${EGG}/${NURSERY}/${INCUBATOR}/${ADD}`, body: payload })

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

export async function updateIncubator(id, payload) {
  try {
    const response = await axiosPost({ url: `${EGG}/${NURSERY}/${INCUBATOR}/${id}/${EDIT}`, body: payload })

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

//   export async function getIngredientDetails(id) {
//     const response = await axiosGet({ url: `${INGREDIENT_DETAIL}/${id}` })

//     return response.data
//   }

//   export async function updateIngredients(payload, id) {
//     try {
//       const url = `${UPDATE_INGREDIENT}/${id}`
//       const response = await axiosFormPost({ url, body: payload })

//       return response?.data
//     } catch (error) {
//       if (error.response) {
//         console.info('Request made and server responded')
//         console.error(error.response.data)
//         console.error(error.response.status)
//         console.error(error.response.headers)
//       }

//       return error
//     }
//   }

//   export async function feedStatusChange(payload, id) {
//     try {
//       const url = `${DIET}/${FEED}/${UPDATE_STATUS}/${id}`
//       const response = await axiosFormPost({ url, body: payload })

//       return response?.data
//     } catch (error) {
//       if (error.response) {
//         console.info('Request made and server responded')
//         console.error(error.response.data)
//         console.error(error.response.status)
//         console.error(error.response.headers)
//       }

//       return error
//     }
//   }

//   export async function feedDelete(id) {
//     try {
//       const url = `${DIET}/${FEED}/${DELETE}/${id}`
//       const response = await axiosFormPost({ url })

//       return response?.data
//     } catch (error) {
//       if (error.response) {
//         console.info('Request made and server responded')
//         console.error(error.response.data)
//         console.error(error.response.status)
//         console.error(error.response.headers)
//       }

//       return error
//     }
//   }
