import {
  ADD_PRESCRIPTION
} from 'src/constants/ApiConstant'
import { axiosFormPost, axiosPost } from '../utility'

export async function addPrescription(payLoad) {
  try {
    const response = await axiosPost({ url: `${ADD_PRESCRIPTION}`, body: payLoad })

    return response?.data
  } catch (error) {
    console.error('Error adding prescription:', error.message)
  }
}