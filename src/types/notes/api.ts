import { NoteItem, NotesDetailsData, NoteTypeItem } from 'src/types/notes'

export interface GetNotesListParams {
  zoo_id: number | string
  page_no: number
  type?: string
  note_type?: string
  priority?: string
  created_by?: string
  tagged_to?: string
}

export interface GetNotesListResponse {
  success: boolean
  data: NoteItem[]
  message?: string
}

export interface NotesReactionPayload {
  notes_id: number | string
}

export interface NotesReactionResponse {
  success: boolean
  data: unknown[]
  message: string
}

export type AddNotesCommentPayload =
  | {
      observation_id: number | string
      observation: string
    }
  | FormData

export interface AddNotesCommentResponse {
  success: boolean
  data: unknown[]
  message: string
}

export interface GetNotesDetailsResponse {
  success: boolean
  data: NotesDetailsData
  message?: string
}

// Note types
export interface GetNoteTypesListResponse {
  success: boolean
  data: NoteTypeItem[]
  message: string | null
}
export interface AddNoteTypePayload {
  type_name: string
  parent_id?: string
}

export interface UpdateNoteTypePayload {
  observation_type_id?: number | string
  type_name: string
  parent_type_id?: string
}
export interface AddNoteTypeResponse {
  success: boolean
  data: unknown[]
  message: string
}
