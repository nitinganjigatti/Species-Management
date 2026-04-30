import {
  LISTING,
  DIET,
  UPDATE_STATUS,
  DETAILS,
  SPECIES,
  ASSIGN_TO_SPECIES,
  DELETE,
  DELETE_SPECIES,
  TYPE,
  ADD,
  UPDATE,
  ANIMAL_LISTS,
  ASSIGN_EDIT,
  ASSIGN_TO_ANIMALS,
  GET_SECTIONS,
  GET_ENCLOSURES,
  GET_TAXONOMYLIST,
  GENERATE_DIET_PDF
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function getDietList({ params }: { params?: Record<string, any> }): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${LISTING}`, params })

  return response.data
}

export async function getDietDetails(id: string | number, params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${DETAILS}/${id}`, params })

  return response.data
}

export async function getSpeciesList(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${SPECIES}`, params })

  return response.data
}

export async function getAnimalsList(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${ANIMAL_LISTS}`, params })

  return response?.data
}

export async function getSectionsList(payload?: Record<string, any> | FormData): Promise<any> {
  try {
    const response = await axiosFormPost({ url: `${GET_SECTIONS}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function getEnclosureList(params?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosGet({ url: `${GET_ENCLOSURES}`, params })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function getTaxonomyList(params?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosGet({ url: `${GET_TAXONOMYLIST}`, params })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function deleteSpeciesFromDiet(payload?: Record<string, any> | FormData): Promise<any> {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${DELETE_SPECIES}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function addAssigntoDiet(payload: Record<string, any> | FormData, selectionType: string): Promise<any> {
  const endpoint = selectionType === 'species' ? ASSIGN_TO_SPECIES : ASSIGN_TO_ANIMALS
  try {
    const response = await axiosFormPost({ url: `${DIET}/${endpoint}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function editAssigntoDiet(payload?: Record<string, any> | FormData): Promise<any> {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${ASSIGN_EDIT}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function dietStatusChange(payload: Record<string, any> | FormData, id: string | number): Promise<any> {
  try {
    const url = `${DIET}/${UPDATE_STATUS}/${id}`
    const response = await axiosFormPost({ url, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function getDietTypeList(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `${DIET}/${TYPE}/${LISTING}`, params })

  return response.data
}

export async function deleteDiet(id: string | number): Promise<any> {
  try {
    const url = `${DIET}/${DELETE}/${id}`
    const response = await axiosFormPost({ url })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.info('Request made and server responded')
      console.error(error.response.data)
      console.error(error.response.status)
      console.error(error.response.headers)
    }

    return error
  }
}

export async function addNewDiet(payload?: Record<string, any> | FormData): Promise<any> {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${ADD}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function updateDiet(id: string | number, payload?: Record<string, any> | FormData): Promise<any> {
  try {
    const response = await axiosFormPost({ url: `${DIET}/${UPDATE}/${id}`, body: payload })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}

export async function generateDietPdf(dietId: string | number): Promise<any> {
  try {
    const formData = new FormData()
    formData.append('diet_id', String(dietId))

    const response = await axiosFormPost({ url: GENERATE_DIET_PDF, body: formData })

    return response?.data
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.data)
    }

    return error
  }
}
