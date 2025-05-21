// src/store/slices/housing/sitesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllSites } from 'src/lib/api/housing'

// Async thunk to fetch sites with pagination
export const fetchSites = createAsyncThunk('site-list', async (params, { rejectWithValue }) => {
  try {
    const response = await getAllSites(params)

    return {
      list: response.data.result,
      total: response.data.total_count
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch sites')
  }
})

const sitesSlice = createSlice({
  name: 'sites',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null
  },
  reducers: {
    clearSites: state => {
      state.list = []
      state.total = 0
      state.page = 1
      state.pageSize = 10
      state.loading = false
      state.error = null
    },
    setPagination: (state, action) => {
      state.page = action.payload.page
      state.pageSize = action.payload.pageSize
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSites.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { clearSites, setPagination } = sitesSlice.actions

export default sitesSlice.reducer
