// src/store/slices/housing/mediaSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllMedia } from 'src/lib/api/housing' // You may need to adjust this import

// Async thunk to fetch media with pagination, search, and sorting
export const fetchMedia = createAsyncThunk('media-list', async (params, { getState, rejectWithValue }) => {
  const { page, pageSize, search } = getState().media

  try {
    const response = await getAllMedia({
      page_no: page,
      limit: pageSize,
      q: search,
      ...params
    })

    if(response) {
      console.log('response', response)
    }

    return {
      list: response?.data?.result || [],
      total: response?.data?.total_count || 0
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch media')
  }
})

const mediaSlice = createSlice({
  name: 'media',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null,
    search: '',
  },
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
    setParams: (state, action) => {
      Object.assign(state, action.payload)
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMedia.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMedia.fulfilled, (state, action) => {
        state.loading = false
        state.list = state.page > 1 ? [...state.list, ...action.payload.list] : action.payload.list
        state.total = action.payload.total
      })      
      .addCase(fetchMedia.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { clearMedia, setParams } = mediaSlice.actions

export default mediaSlice.reducer
