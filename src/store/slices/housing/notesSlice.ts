import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  getAllNotes,
  getObservationMasterList,
  getUserListPost,
  getObservationTypes,
  getObservationTemplates,
  createObservationTemplate,
  deleteObservationTemplate
} from 'src/lib/api/housing'
import type { GetUserListPostParams, CreateObservationTemplatePayload } from 'src/lib/api/housing'
import type {
  Note,
  NotesState,
  NotesFilters,
  FetchNotesResult,
  SetPaginationPayload,
  SetFiltersPayload,
  ObservationType,
  ObservationMasterItem,
  User,
  GetNotesParams,
  GetObservationMasterListParams,
  ObservationTemplate
} from 'src/types/housing'

// Async thunk to fetch notes with pagination
export const fetchNotes = createAsyncThunk<
  FetchNotesResult & { page: number },
  GetNotesParams,
  { rejectValue: string }
>('notes/fetchNotes', async (params, { rejectWithValue }) => {
  try {
    const response = await getAllNotes(params)

    return {
      list: response.data?.result || [],
      total: response.data?.total_count || 0,
      page: params.page_no || 1
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch notes')
  }
})

// Async thunk to fetch observation types (parent types for SelectNoteTypeDrawer)
export const fetchObservationTypes = createAsyncThunk<
  ObservationType[],
  void,
  { rejectValue: string }
>('notes/fetchObservationTypes', async (_, { rejectWithValue }) => {
  try {
    const response = await getObservationTypes()

    return response.data || []
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch observation types')
  }
})

// Async thunk to fetch observation master list (note types for filters)
export const fetchObservationMasterList = createAsyncThunk<
  ObservationMasterItem[],
  GetObservationMasterListParams | undefined,
  { rejectValue: string }
>('notes/fetchObservationMasterList', async (params, { rejectWithValue }) => {
  try {
    const response = await getObservationMasterList(params)

    return response.data || []
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch observation master list')
  }
})

export const fetchUsers = createAsyncThunk<
  User[],
  GetUserListPostParams,
  { rejectValue: string }
>('notes/fetchUsers', async (params, { rejectWithValue }) => {
  try {
    const requestParams: GetUserListPostParams = {
      zoo_id: params.zoo_id,
      isActive: true
    }

    if (params.role_id) {
      requestParams.role_id = params.role_id
    }
    if (params.site_id) {
      requestParams.site_id = params.site_id
    }
    if (params.q) {
      requestParams.q = params.q
    }

    const response = await getUserListPost(requestParams)

    return (response.data || []) as User[]
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch users')
  }
})

// Async thunk to fetch observation templates (notify member groups)
export interface FetchTemplatesParams {
  zoo_id: number
  observation_types?: number | string
}

export const fetchTemplates = createAsyncThunk<
  ObservationTemplate[],
  FetchTemplatesParams,
  { rejectValue: string }
>('notes/fetchTemplates', async (params, { rejectWithValue }) => {
  try {
    const response = await getObservationTemplates({
      ZooId: params.zoo_id,
      observation_types: params.observation_types
    })

    const result = response?.data?.result || response?.result || []
    const rawTemplates = Array.isArray(result) ? result : []

    const templates = rawTemplates.map(template => {
      let templateItems = template.template_items

      if (typeof templateItems === 'string') {
        try {
          templateItems = JSON.parse(templateItems)
        } catch (e) {
          templateItems = []
        }
      }

      if (!Array.isArray(templateItems)) {
        templateItems = []
      }

      return {
        ...template,
        template_items: templateItems
      }
    })

    return templates
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch templates')
  }
})

export const createTemplate = createAsyncThunk<
  ObservationTemplate,
  CreateObservationTemplatePayload,
  { rejectValue: string }
>('notes/createTemplate', async (payload, { rejectWithValue }) => {
  try {
    const response = await createObservationTemplate(payload)

    if (response?.success !== false && response?.data) {
      return response.data
    }

    return rejectWithValue(response?.message || 'Failed to create template')
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to create template')
  }
})

// Async thunk to delete observation template
export const deleteTemplate = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('notes/deleteTemplate', async (templateId, { rejectWithValue }) => {
  try {
    const response = await deleteObservationTemplate(templateId)

    if (response.success) {
      return templateId
    }

    return rejectWithValue(response.message || 'Failed to delete template')
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to delete template')
  }
})

const initialFilters: NotesFilters = {
  noteType: null,
  priority: null,
  createdBy: null,
  taggedTo: null
}

const initialState: NotesState = {
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,
  filters: initialFilters,
  observationTypes: [],
  observationTypesLoading: false,
  observationMasterList: [],
  observationMasterListLoading: false,
  users: [],
  usersLoading: false,
  templates: [],
  templatesLoading: false
}

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearNotes: state => {
      state.list = []
      state.total = 0
      state.page = 1
      state.pageSize = 10
      state.loading = false
      state.error = null
      state.filters = initialFilters
    },
    setPagination: (state, action: PayloadAction<SetPaginationPayload>) => {
      state.page = action.payload.page
      state.pageSize = action.payload.pageSize
    },
    setFilters: (state, action: PayloadAction<Partial<SetFiltersPayload>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      }
      // Reset pagination when filters change
      state.page = 1
    },
    clearFilters: state => {
      state.filters = initialFilters
      state.page = 1
    },
    updateNoteLike: (state, action: PayloadAction<{ observationId: number; isLiked: boolean }>) => {
      const { observationId, isLiked } = action.payload
      const noteIndex = state.list.findIndex(note => note.observation_id === observationId)
      if (noteIndex !== -1) {
        const note = state.list[noteIndex]
        const currentCount = note.reaction_counts?.like || 0
        state.list[noteIndex] = {
          ...note,
          user_reaction: isLiked ? 'like' : null,
          reaction_counts: {
            ...note.reaction_counts,
            like: isLiked ? currentCount + 1 : Math.max(0, currentCount - 1)
          }
        }
      }
    }
  },
  extraReducers: builder => {
    builder
      // Fetch Notes
      .addCase(fetchNotes.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotes.fulfilled, (state, action: PayloadAction<FetchNotesResult & { page: number }>) => {
        state.loading = false
        // Append items for infinite scroll (page > 1), replace for first page or refresh
        if (action.payload.page > 1) {
          state.list = [...state.list, ...action.payload.list]
        } else {
          state.list = action.payload.list
        }
        state.total = action.payload.total
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message || null
      })
      // Fetch Observation Types
      .addCase(fetchObservationTypes.pending, state => {
        state.observationTypesLoading = true
      })
      .addCase(fetchObservationTypes.fulfilled, (state, action: PayloadAction<ObservationType[]>) => {
        state.observationTypesLoading = false
        state.observationTypes = action.payload
      })
      .addCase(fetchObservationTypes.rejected, state => {
        state.observationTypesLoading = false
      })
      // Fetch Observation Master List
      .addCase(fetchObservationMasterList.pending, state => {
        state.observationMasterListLoading = true
      })
      .addCase(fetchObservationMasterList.fulfilled, (state, action: PayloadAction<ObservationMasterItem[]>) => {
        state.observationMasterListLoading = false
        state.observationMasterList = action.payload
      })
      .addCase(fetchObservationMasterList.rejected, state => {
        state.observationMasterListLoading = false
      })
      // Fetch Users
      .addCase(fetchUsers.pending, state => {
        state.usersLoading = true
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.usersLoading = false
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, state => {
        state.usersLoading = false
      })
      // Fetch Templates
      .addCase(fetchTemplates.pending, state => {
        state.templatesLoading = true
      })
      .addCase(fetchTemplates.fulfilled, (state, action: PayloadAction<ObservationTemplate[]>) => {
        state.templatesLoading = false
        state.templates = action.payload
      })
      .addCase(fetchTemplates.rejected, state => {
        state.templatesLoading = false
      })
      // Create Template
      .addCase(createTemplate.fulfilled, (state, action: PayloadAction<ObservationTemplate>) => {
        state.templates = [...state.templates, action.payload]
      })
      // Delete Template
      .addCase(deleteTemplate.fulfilled, (state, action: PayloadAction<number>) => {
        state.templates = state.templates.filter(t => t.id !== action.payload)
      })
  }
})

export const { clearNotes, setPagination, setFilters, clearFilters, updateNoteLike } = notesSlice.actions

export default notesSlice.reducer
