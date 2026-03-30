import { axiosFormPost, axiosGet, axiosPost } from '../utility'
import {
  GET_NOTES_LIST,
  ADD_NOTES_REACTION,
  REMOVE_NOTES_REACTION,
  GET_NOTES_DETAILS,
  ADD_NOTES_COMMENT
} from 'src/constants/ApiConstant'

export async function getNotesList({ params }) {
  try {
    const response = await axiosGet({ url: `${GET_NOTES_LIST}`, params: params })

    return response.data
  } catch (error: any) {
    console.error('Error fetching notes list:', error?.message || error)
    throw error
  }
}

export async function addNotesReaction(payload: any) {
  try {
    const response = await axiosPost({ url: `${ADD_NOTES_REACTION}`, body: payload })

    return response.data
  } catch (error: any) {
    console.error('Error adding notes reaction:', error?.message || error)
    throw error
  }
}
  

export async function removeNotesReaction(payload: any) {
  try {
    const response = await axiosPost({ url: `${REMOVE_NOTES_REACTION}`, body: payload })

    return response.data
  } catch (error: any) {
    console.error('Error removing notes reaction:', error?.message || error)
    throw error
  }
}

export async function getNotesDetails(observationId: number | string) {
  console.log('Fetching details for observation_id:', observationId)
  try {
    const response = await axiosGet({ url: `${GET_NOTES_DETAILS}?observation_id=${observationId}` })

    return response.data
  } catch (error: any) {
    console.error('Error fetching notes list:', error?.message || error)
    throw error
  }
}

export async function addNotesComment(payload: any) {
  try {
    const response = await axiosFormPost({ url: `${ADD_NOTES_COMMENT}`, body: payload })

    return response.data
  } catch (error: any) {
    console.error('Error adding notes comment:', error?.message || error)
    throw error
  }
}