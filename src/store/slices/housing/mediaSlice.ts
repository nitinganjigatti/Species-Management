import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getAllMedia } from 'src/lib/api/housing'
import type {
  Media,
  MediaState,
  FetchListResult,
  GetMediaParams
} from 'src/types/housing'

interface RootState {
  media: MediaState
}

interface MediaSetParamsPayload {
  page?: number
  pageSize?: number
  search?: string
}

// Async thunk to fetch media with pagination and search
export const fetchMedia = createAsyncThunk<
  FetchListResult<Media>,
  Partial<GetMediaParams> | undefined,
  { state: RootState; rejectValue: string }
>('media-list', async (params, { getState, rejectWithValue }) => {
  const { page, pageSize, search } = getState().media

  try {
    const response = await getAllMedia({
      page_no: page,
      limit: pageSize,
      q: search,
      ...params
    })

    return {
      list: response?.data?.result || [],
      total: response?.data?.total_count || 0
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch media')
  }
})

const initialState: MediaState = {
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,
  search: ''
}

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    clearMedia: state => {
      state.list = []
      state.total = 0
      state.page = 1
      state.pageSize = 10
      state.search = ''
      state.loading = false
      state.error = null
    },
    setParams: (state, action: PayloadAction<Partial<MediaSetParamsPayload>>) => {
      Object.assign(state, action.payload)
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMedia.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMedia.fulfilled, (state, action: PayloadAction<FetchListResult<Media>>) => {
        state.loading = false
        state.list = state.page > 1 ? [...state.list, ...action.payload.list] : action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchMedia.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { clearMedia, setParams } = mediaSlice.actions

export default mediaSlice.reducer
