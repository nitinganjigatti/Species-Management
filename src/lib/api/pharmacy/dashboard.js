import { axiosGet } from '../utility'
import {
  DASHBOARD_REPORT,
  DASHBOARD_FAST_MOVING,
  DASHBOARD_NEW_REQUEST,
  DASHBOARD_COMPLETED_REQUESTS,
  DASHBOARD_PENDING_REQUEST,
  DASHBOARD_STORE_WISE_PENDING_REQUEST,
  DASHBOARD_MONTHLY_DISPATCH,
  DASHBOARD_MONTHLY_PURCHASE
} from 'src/constants/ApiConstant'

export async function getAllLists() {
  try {
    const url = DASHBOARD_REPORT
    const response = await axiosGet({ url, pharmacy: true })

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

export async function getFastMovingStocks() {
  try {
    const url = DASHBOARD_FAST_MOVING
    const response = await axiosGet({ url, pharmacy: true })

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

export async function getNewRequestsList() {
  try {
    const url = DASHBOARD_NEW_REQUEST
    const response = await axiosGet({ url, pharmacy: true })

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

export async function getCompletedRequestsList() {
  try {
    const url = DASHBOARD_COMPLETED_REQUESTS
    const response = await axiosGet({ url, pharmacy: true })

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

export async function getPendingList() {
  try {
    const url = DASHBOARD_PENDING_REQUEST
    const response = await axiosGet({ url, pharmacy: true })

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

export async function getStoreWisePendingList() {
  try {
    const url = DASHBOARD_STORE_WISE_PENDING_REQUEST
    const response = await axiosGet({ url, pharmacy: true })

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

export async function getMonthWiseDispatchList() {
  try {
    const url = DASHBOARD_MONTHLY_DISPATCH
    const response = await axiosGet({ url, pharmacy: true })

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

export async function getMonthWisePurchaseList() {
  try {
    const url = DASHBOARD_MONTHLY_PURCHASE
    const response = await axiosGet({ url, pharmacy: true })

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
