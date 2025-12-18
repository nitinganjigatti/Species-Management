import {
  ADD_DIRECT_ADMINISTER_PRESCRIPTION,
  ADD_PRESCRIPTION,
  ADMINISTER_ALL_MEDICINES,
  ADMINISTER_PRESCRIPTION,
  DIRECT_ADMINISTER_FOR_PAST_SLOT,
  GET_BATCH_LIST,
  GET_FREQUENCY,
  GET_INTERVALS,
  GET_PRESCRIPTION_BY_RECORD,
  GET_PRESCRIPTION_DETAILS,
  GET_PRESCRIPTION_DETAILS_DATES,
  GET_PRESCRIPTION_LIST,
  GET_TRANSFER_CHECK,
  SCHEDULE_PRESCRIPTION,
  SKIP_PRESCRIPTION,
  STOP_PRESCRIPTION,
  UNDO_PRESCRIPTION
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosGet, axiosPost } from '../utility'

export async function addPrescription(payLoad) {
  try {
    const response = await axiosFormPost({ url: `${ADD_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function addDirectAdministerPrescription(payLoad) {
  try {
    const response = await axiosFormPost({ url: `${ADD_DIRECT_ADMINISTER_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function getPrescriptions(params) {
  try {
    const url = GET_PRESCRIPTION_LIST
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getPrescriptionDetails(params) {
  try {
    const url = GET_PRESCRIPTION_DETAILS
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getDates(params) {
  try {
    const url = GET_PRESCRIPTION_DETAILS_DATES
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching clinical notes:', error.message)
  }
}

export async function getFrequency(params) {
  try {
    const url = `${GET_FREQUENCY}`

    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical master data:', error.message)
  }
}

export async function getIntervalList(params) {
  try {
    const url = `${GET_INTERVALS}`

    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical master data:', error.message)
  }
}

export async function getMedicineBatches(params) {
  try {
    const url = `${GET_BATCH_LIST}`

    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching medical master data:', error.message)
  }
}

export async function stopPrescription(payLoad) {
  try {
    const response = await axiosPost({ url: `${STOP_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function undoPrescription(payLoad) {
  try {
    const response = await axiosPost({ url: `${UNDO_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function administerDose(payLoad) {
  try {
    const response = await axiosFormPost({ url: `${ADMINISTER_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function administerAllMedicines(payLoad) {
  try {
    const response = await axiosPost({ url: `${ADMINISTER_ALL_MEDICINES}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function schedulePrescription(payLoad) {
  try {
    const response = await axiosPost({ url: `${SCHEDULE_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function directAdministerForPatSlot(payLoad) {
  try {
    const response = await axiosFormPost({ url: `${DIRECT_ADMINISTER_FOR_PAST_SLOT}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}

export async function getPrescriptionsByRecord(params) {
  try {
    const url = GET_PRESCRIPTION_BY_RECORD
    const response = await axiosGet({ url, params })

    return response?.data
  } catch (error) {
    console.error('Error fetching Prescriptions Record:', error?.message)
  }
}

export async function getSecurityCheckForTransfer(siteId) {
  const response = await axiosGet({ url: `${GET_TRANSFER_CHECK}/${siteId}` })

  return response?.data
}
