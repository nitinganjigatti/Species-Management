import { axiosFormPost, axiosGet, axiosPost } from '../utility'
import {
  GET_NOTES_LIST,
  ADD_NOTES_REACTION,
  REMOVE_NOTES_REACTION,
  GET_NOTES_DETAILS,
  ADD_NOTES_COMMENT,
  GET_NOTE_TYPES_LIST,
  ADD_NOTE_TYPE,
  UPDATE_NOTE_TYPE,
  DELETE_NOTE_TYPE
} from 'src/constants/ApiConstant'
import {
  GetNotesListParams,
  GetNotesListResponse,
  NotesReactionPayload,
  NotesReactionResponse,
  AddNotesCommentPayload,
  AddNotesCommentResponse,
  GetNotesDetailsResponse,
  GetNoteTypesListResponse,
  AddNoteTypePayload,
  UpdateNoteTypePayload,
  AddNoteTypeResponse
} from 'src/types/notes/api'

export async function getNotesList({ params }: { params: GetNotesListParams }): Promise<GetNotesListResponse> {
  try {
    const response = await axiosGet({ url: `${GET_NOTES_LIST}`, params: params, pharmacy: false })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching notes list:', error?.message || error)
    throw error
  }
}

export async function addNotesReaction(payload: NotesReactionPayload): Promise<NotesReactionResponse> {
  try {
    const response = await axiosPost({ url: `${ADD_NOTES_REACTION}`, body: payload, pharmacy: false })

    return response?.data
  } catch (error: any) {
    console.error('Error adding notes reaction:', error?.message || error)
    throw error
  }
}

export async function removeNotesReaction(payload: NotesReactionPayload): Promise<NotesReactionResponse> {
  try {
    const response = await axiosPost({ url: `${REMOVE_NOTES_REACTION}`, body: payload, pharmacy: false })

    return response?.data
  } catch (error: any) {
    console.error('Error removing notes reaction:', error?.message || error)
    throw error
  }
}

export async function getNotesDetails(observationId: number | string): Promise<GetNotesDetailsResponse> {
  console.log('Fetching details for observation_id:', observationId)
  try {
    const response = await axiosGet({
      url: `${GET_NOTES_DETAILS}?observation_id=${observationId}`,
      params: {},
      pharmacy: false
    })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching notes list:', error?.message || error)
    throw error
  }
}

export async function addNotesComment(payload: AddNotesCommentPayload): Promise<AddNotesCommentResponse> {
  try {
    const response = await axiosFormPost({ url: `${ADD_NOTES_COMMENT}`, body: payload, pharmacy: false })

    return response?.data
  } catch (error: any) {
    console.error('Error adding notes comment:', error?.message || error)
    throw error
  }
}

export async function getNoteTypesList(params: { type: string }): Promise<GetNoteTypesListResponse> {
  try {
    const response = await axiosGet({ url: `${GET_NOTE_TYPES_LIST}`, params: params, pharmacy: false })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching note types list:', error?.message || error)
    throw error
  }
}

export async function addNoteTypes(payload: AddNoteTypePayload): Promise<AddNoteTypeResponse> {
  try {
    const response = await axiosPost({ url: `${ADD_NOTE_TYPE}`, body: payload, pharmacy: false })

    return response?.data
  } catch (error: any) {
    console.error('Error adding note types:', error?.message || error)
    throw error
  }
}

export async function getChildNoteTypesList(parent_id: number | string): Promise<GetNoteTypesListResponse> {
  try {
    const response = await axiosGet({
      url: `${GET_NOTE_TYPES_LIST}`,
      params: { parent_id: parent_id },
      pharmacy: false
    })

    return response?.data
  } catch (error: any) {
    console.error('Error fetching note types list:', error?.message || error)
    throw error
  }
}

export async function updateNoteType(payload: UpdateNoteTypePayload): Promise<AddNoteTypeResponse> {
  try {
    const response = await axiosPost({ url: `${UPDATE_NOTE_TYPE}`, body: payload, pharmacy: false })

    return response?.data
  } catch (error: any) {
    console.error('Error updating note type:', error?.message || error)
    throw error
  }
}

export async function deleteNoteType(params: { observation_type_id: number | string }): Promise<AddNoteTypeResponse> {
  try {
    const response = await axiosGet({ url: `${DELETE_NOTE_TYPE}`, params: params, pharmacy: false })

    return response?.data
  } catch (error: any) {
    console.error('Error deleting note type:', error?.message || error)
    throw error
  }
}
