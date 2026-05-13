import { DIET } from '../../../constants/ApiConstant'
import { axiosGet, axiosFormPost, axiosPost } from '../utility'

export async function getSpeciesList(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/get-species-list`, params })

  return response.data
}

export async function getAnimalList(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/get-animal-list-uploaded-diet`, params })

  return response.data
}

export async function getAnimalDetailUploadedDiet(id: string | number, params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/get-animal-detail-uploaded-diet/${id}`, params })

  return response.data
}

export async function animalDietAttachmentStatus(payload?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({ url: `${DIET}/animal-diet-attachments-status`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function getSpecieDetailById(id: string | number, params?: Record<string, any>): Promise<any> {
  return await axiosGet({ url: `${DIET}/get-species-detail/${id}`, params })
}

export async function speciesAttachmentRemoveById(id: string | number): Promise<any> {
  return await axiosPost({ url: `${DIET}/species-attachment-remove/${id}` })
}

export async function speciesAttachmentUpload(payload?: Record<string, any> | FormData): Promise<any> {
  try {
    const response = await axiosFormPost({ url: `${DIET}/species-attachment-upload`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function speciesAttachmentRemove(id: string | number): Promise<any> {
  try {
    const response = await axiosPost({ url: `${DIET}/species-attachment-remove/${id}` })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function speciesAttachmentActive(payload?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({ url: `${DIET}/species-attachment-active`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function getClassList(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `get/taxonomy/hierarchy`, params })

  return response.data
}

// export async function updateRecipeStatus(id, payload) {
//   try {
//     const response = await axiosPost({ url: `${DIET}/${RECIPES}/${UPDATE_STATUS}/${id}`, body: payload })

//     return response?.data
//   } catch (error) {
//     if (error.response) {
//       console.error(error.response.data)
//     }

//     return error
//   }
// }

// export async function updateRecipe(id, payload) {
//   try {
//     const response = await axiosFormPost({ url: `${DIET}/${RECIPES}/${UPDATE}/${id}`, body: payload })

//     return response?.data
//   } catch (error) {
//     if (error.response) {
//       console.error(error.response.data)
//     }

//     return error
//   }
// }
