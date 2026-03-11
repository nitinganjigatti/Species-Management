import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getAllNotes, getObservationMasterList, getUserListPost, getObservationTypes } from 'src/lib/api/housing'
import type { GetUserListPostParams } from 'src/lib/api/housing'
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
  GetObservationMasterListParams
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

// Async thunk to fetch users list using POST method (matches mobile implementation)
export const fetchUsers = createAsyncThunk<
  User[],
  GetUserListPostParams,
  { rejectValue: string }
>('notes/fetchUsers', async (params, { rejectWithValue }) => {
  try {
    const response = await getUserListPost({
      zoo_id: params.zoo_id,
      isActive: true // Only fetch active users
    })

    // Map API response to User type
    return (response.data || []) as User[]
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch users')
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
  usersLoading: false
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
  }
})

export const { clearNotes, setPagination, setFilters, clearFilters, updateNoteLike } = notesSlice.actions

export default notesSlice.reducer
