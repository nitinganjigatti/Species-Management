import { ADD, EDIT, EGG, INCUBATOR, LIST, NURSERY } from 'src/constants/ApiConstant'
import { axiosGet, axiosPost } from '../../utility'

export async function getIncubatorList({ q, page_no, til_date }) {
  return await axiosGet({
    // url: `${EGG}/${NURSERY}/${INCUBATOR}/${LIST}?room_id=1&nursery_id=2&q=${q}&page_no=${page_no}&from_date=2024-05-29&til_date=2024-05-31&site_id=14`
    url: `${EGG}/${NURSERY}/${INCUBATOR}/${LIST}?q=${q}&page_no=${page_no}&from_date=2024-05-29&til_date=${til_date}`
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
