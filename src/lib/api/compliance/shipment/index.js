import {
  ADD_DOCUMENT,
  ADD_EXPORT,
  EDIT_DOCUMENT,
  EDIT_EXPORT,
  GET_DOCUMENT_TYPE,
  GET_EXPORTS_DETAILS,
  GET_SHIPMENTS_LIST
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../../utility'

export const getShipmentList = async params => {
  const response = await axiosGet({
    url: `${GET_SHIPMENTS_LIST}`,
    params
  })

  return response.data
}
