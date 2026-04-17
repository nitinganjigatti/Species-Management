import { PHARMACY_STOCK_SETTINGS_LIST, PHARMACY_BASE_URL } from 'src/constants/ApiConstant'
import { axiosPost, axiosGet } from '../utility'

export const submitPharmacySettings = async payload => {
  try {
    const url = `${PHARMACY_BASE_URL}${PHARMACY_STOCK_SETTINGS_LIST}`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy: true })

    return response?.data
  } catch (error) {
    console.error('Error submitting pharmacy settings:', error)

    return error
  }
}

export const getLowStockNotificationUserList = async params => {
  try {
    const url = `${PHARMACY_BASE_URL}${PHARMACY_STOCK_SETTINGS_LIST}`
    const mergedParams = { type: 'pharmacy', ...params }

    const response = await axiosGet({ url, params: mergedParams, pharmacy: true })

    return { success: true, data: response?.data }
  } catch (error) {
    console.error('Error fetching pharmacy settings:', error)

    return error
  }
}
