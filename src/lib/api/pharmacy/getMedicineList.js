import {
  MEDICINE,
  PHARMACY_BASE_URL,
  LOCAL_STOCK_REPORT,
  LEDGER,
  PRODUCT_DASHBOARD,
  PRODUCT_DASHBOARD_MONTHLY_PURCHASE,
  PRODUCT_DASHBOARD_MONTHLY_DISPATCH,
  PRODUCT_ABOUT_TO_EXPIRE,
  PRODUCT_EXPIRED_BATCHES,
  PRODUCT_QUANTITY_IN_STORE,
  PRODUCT_DISPATCH,
  PRODUCT_PURCHASE,
  PRODUCT_PURCHASE_BATCH_LIST
} from '../../../constants/ApiConstant'
import { axiosGet, axiosPost, axiosFormPost } from '../utility'

export async function getMedicineList({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${MEDICINE}/list`, params, pharmacy: true })

  return response.data
}

export async function getLocalMedicineList({ params }) {
  const response = await axiosGet({ url: `${LOCAL_STOCK_REPORT}`, params, pharmacy: true })

  return response.data
}

export async function getGenericMedicineList({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}stock/list`, params, pharmacy: true })

  return response.data
}

export async function addMedicine(payload) {
  try {
    const url = `${PHARMACY_BASE_URL}${MEDICINE}/add`
    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

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

export async function getMedicineById(id) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}${MEDICINE}/${id}`, pharmacy: true })

  return response.data
}

export async function updateMedicineById(payload, id) {
  try {
    const url = `${PHARMACY_BASE_URL}${MEDICINE}/update/${id}`
    var data = payload
    data.id = id
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

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

export async function getMedicineConfig(id) {
  const response = await axiosGet({ url: `stock-item/${id}/config`, pharmacy: true })

  if (response?.status == 200 && response?.data?.success) {
    return response.data.data
  } else {
    return []
  }
}

export async function addMedicineConfig(payload, id) {
  try {
    const url = `stock-item/${id}/config`
    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

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

export async function deleteMedicineConfig(id) {
  const response = await axiosGet({ url: `stock-item/config/${id}/delete`, pharmacy: true })

  if (response?.status == 200 && response?.data?.success) {
    return response.data
  }
}

export async function addMedicineMinQuantity(payload, id) {
  try {
    const url = `stock-item/${id}/min-qty`
    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

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

export async function updateMedicineConfig(payload, id, configId) {
  try {
    const url = `stock-item/${id}/config/${configId}/update`
    var data = payload
    const response = await axiosFormPost({ url, body: data, pharmacy: true })

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

export async function getLedgerList(payload) {
  try {
    const url = `${LEDGER}`
    var data = payload
    const response = await axiosPost({ url, body: data, pharmacy: true })

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

export async function getProductDashboardList(id) {
  const response = await axiosGet({ url: `${PRODUCT_DASHBOARD}/${id}`, pharmacy: true })

  return response.data
}

export async function getProductMonthWisePurchaseList(id) {
  try {
    const url = `${PRODUCT_DASHBOARD_MONTHLY_PURCHASE}/${id}`
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

export async function getProductMonthWiseDispatchList(id) {
  try {
    const url = `${PRODUCT_DASHBOARD_MONTHLY_DISPATCH}/${id}`
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

export async function getProductAboutToExpireList(id) {
  try {
    const url = `${PRODUCT_ABOUT_TO_EXPIRE}/${id}`
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

export async function getProductExpiredBatchesList(id) {
  try {
    const url = `${PRODUCT_EXPIRED_BATCHES}/${id}`
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

export async function getProductQuantityInStoresList(id) {
  try {
    const url = `${PRODUCT_QUANTITY_IN_STORE}/${id}`
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

export async function getDispatchList(params, id) {
  const response = await axiosGet({ url: `${PRODUCT_DISPATCH}/${id}`, params, pharmacy: true })

  return response.data
}

export async function getPurchaseDetailsList(params, id) {
  const response = await axiosGet({ url: `${PRODUCT_PURCHASE}/${id}`, params, pharmacy: true })

  return response.data
}

export async function getPurchaseBatchDetailsList(id, params) {
  const response = await axiosGet({ url: `${PRODUCT_PURCHASE_BATCH_LIST}/${id}/show`, params, pharmacy: true })

  return response.data
}

export async function getAvailableProductsInPharmacy({ params }) {
  const response = await axiosGet({ url: `${PHARMACY_BASE_URL}stock/local/list`, params, pharmacy: true })

  return response.data
}
