import { GET_EXPORTS_DETAILS, GET_EXPORTS_LIST } from 'src/constants/ApiConstant'
import { axiosGet } from '../../utility'

export const getExportCountries = async () => {
  return {
    success: true,
    data: [
      { label: 'Country 1', value: 'report' },
      { label: 'Country 2', value: 'invoice' },
      { label: 'Country 3', value: 'manifest' }
    ]
  }
}

export const getSpecies = async () => {
  return {
    success: true,
    data: [
      { label: 'Species 1', value: 'report' },
      { label: 'Species 2', value: 'invoice' },
      { label: 'Species 3', value: 'manifest' }
    ]
  }
}

export const getExportList = async params => {
  const response = await axiosGet({
    url: `${GET_EXPORTS_LIST}`,
    params
  })

  return response.data
}

export const getExportDetails = async id => {
  const response = await axiosGet({
    url: `${GET_EXPORTS_DETAILS}/${id}`
  })

  return response.data
}
