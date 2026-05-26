import { axiosFormPost, axiosGet, axiosPost } from 'src/lib/api/utility'
import { COMMENT, EGG, LIST, SPECIES_LIST } from 'src/constants/ApiConstant'

export async function getAccessionType(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `masters/getAccessionType`, params })
  return response.data
}

export async function getAnimalGetconfigs(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `animal/getconfigs`, params })
  return response.data
}

export async function getMastersOrganization(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `masters/organization`, params })
  return response.data
}

export async function getAnimalMaster(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `animal/getAnimalMaster`, params })
  return response.data
}

export async function getZoosSectionListing(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `zoos/section/listing`, params })
  return response.data
}

export async function getMasterInstitutes(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `master/institutes`, params })
  return response.data
}

export async function getAnimalOwnershipTerms(params?: Record<string, any>): Promise<any> {
  const response = await axiosGet({ url: `masters/animal-ownership-terms`, params })
  return response.data
}

export async function createAnimal(params: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({
      url: `animal/create`,
      body: params
    })
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

export async function createGroupAnimal(params: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({
      url: `groupAnimal/create`,
      body: params
    })
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

export async function getTaxonomyList(params?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosPost({
      url: `taxonomyunits`,
      body: params
    })
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

export async function getSpecieList(params?: Record<string, any>): Promise<any> {
  try {
    const response = await axiosGet({
      url: 'species-list-egg-wise',
      params: params
    })
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

export async function getSectionList(params?: Record<string, any>): Promise<any> {
  const response = await axiosPost({ url: `zoos/section/listing`, body: params })
  return response.data
}

export async function getEnclosures(params?: Record<string, any>): Promise<any> {
  const response = await axiosPost({ url: `section/parentchild/enclosure/listing`, body: params })
  return response.data
}
