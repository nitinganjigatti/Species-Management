import { axiosFormPost, axiosGet, axiosPost } from '../../utility'

export async function getCategoriesList({ params }) {
  const url = `v1/master/medical/category`
  const response = await axiosGet({ url: url, params })
  
return response.data
}

export async function getMedicalCategoryListById(id, params) {
  const url = `v1/master/category/details/list/${id}`
  const response = await axiosGet({ url: url, params })
  
return response.data
}

export async function addMedicalCategory(payload) {
  try {
    const url = `v1/master/medical/category`
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

export async function updateMedicalCategory(id, payload) {
  const url = `v1/master/medical/category/${id}`
  try {
    const response = await axiosFormPost({ url: url, body: payload })

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

export async function addMedicalComplaintOrDiagnosis(type, payload) {
  try {
    const url = `v1/master/add/medical/${type}`
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

export async function updateMedicalCategoryDiagnosis(id, payload) {
  const url = `v1/master/diagnosis/${id}`
  try {
    const response = await axiosFormPost({ url: url, body: payload })

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

export async function updateMedicalCategoryComplaint(id, payload) {
  const url = `v1/master/complaints/${id}`
  try {
    const response = await axiosFormPost({ url: url, body: payload })

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

// export async function deleteMedical(id) {
//   const url = `masters/delete-sample-types/${id}`

//   try {
//     const response = await axiosFormPost({ url })
//     return response?.data
//   } catch (error) {
//     if (error.response) {
//       console.error(error.response.data)
//     }
//     return error
//   }
// }
