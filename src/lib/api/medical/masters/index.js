import {
  ADD_ASSESSMENT_MASTERS,
  ADD_ASSESSMENT_MASTERS_BY_TYPE,
  ADD_MEASUREMENT_UNITS,
  ADD_MEDICAL_DELIVERY_ROUTE,
  GET_MEASUREMENT_BASE_UOM,
  GET_MEASUREMENT_UNITS_MASTERS,
  GET_MEDICAL_DELIVERY_ROUTE_LIST,
  UPDATE_ASSESSMENT_MASTERS,
  UPDATE_ASSESSMENT_MASTERS_BY_TYPE,
  UPDATE_MEASUREMENT_UNITS,
  UPDATE_MEDICAL_DELIVERY_ROUTE
} from 'src/constants/ApiConstant'
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

export async function AddAssessmentCategory(payload) {
  try {
    const url = `v1/assessment/type/list`
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

export async function updateAssessmentCategory(id, payload) {
  const url = `/${id}`
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

export async function getMedicalDeliveryRoute({ params }) {
  const response = await axiosGet({ url: `${GET_MEDICAL_DELIVERY_ROUTE_LIST}`, params })

  return response.data
}

export const addDeliveryRoute = async payload => {
  const response = await axiosFormPost({ url: `${ADD_MEDICAL_DELIVERY_ROUTE}`, body: payload })

  return response?.data
}

export const updateDeliveryRoute = async payload => {
  const response = await axiosFormPost({ url: `${UPDATE_MEDICAL_DELIVERY_ROUTE}`, body: payload })

  return response?.data
}

export async function getMeasurementUnitsMasters({ params }) {
  const response = await axiosGet({ url: `${GET_MEASUREMENT_UNITS_MASTERS}`, params })

  return response.data
}

export const addMeasurementUnits = async payload => {
  const response = await axiosPost({ url: `${ADD_MEASUREMENT_UNITS}`, body: payload })

  return response?.data
}

export const updateMeasurementUnits = async payload => {
  const response = await axiosFormPost({ url: `${UPDATE_MEASUREMENT_UNITS}`, body: payload })

  return response?.data
}

export async function getMeasurementBaseUOM({ params }) {
  const response = await axiosGet({ url: `${GET_MEASUREMENT_BASE_UOM}`, params })

  return response.data
}

export const addAssessmentMastersByType = async payload => {
  const response = await axiosFormPost({ url: `${ADD_ASSESSMENT_MASTERS_BY_TYPE}`, body: payload })

  return response?.data
}

export const updateAssessmentMastersByType = async payload => {
  const response = await axiosFormPost({ url: `${UPDATE_ASSESSMENT_MASTERS_BY_TYPE}`, body: payload })

  return response?.data
}

export const addAssessmentMasters = async payload => {
  const response = await axiosPost({ url: `${ADD_ASSESSMENT_MASTERS}`, body: payload })

  return response?.data
}

export const updateAssessmentMasters = async payload => {
  const response = await axiosPost({ url: `${UPDATE_ASSESSMENT_MASTERS}`, body: payload })

  return response?.data
}
