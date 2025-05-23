// src/store/slices/housing/speciesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getMortalityList } from 'src/lib/api/housing'

// Async thunk to fetch species with pagination
export const fetchMortality = createAsyncThunk('mortality-list', async (params, { getState, rejectWithValue }) => {
  const { page, pageSize, search, sortBy, sortOrder } = getState().mortality

  try {
    
    const response = await getMortalityList({
      page_no: page,
      limit: pageSize,
      q: search,
      sort_by: sortBy,
      sort_order: sortOrder,
      ...params
    })
    if (response) {
      console.log('response', response)
    }

    return {
      list: response?.data?.result || [],
      total: response?.data?.total_count || 0
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch mortality')
  }
})

const mortalitySlice = createSlice({
  name: 'mortality',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  },
  reducers: {
    clearMortality: state => {
      state.list = []
      state.total = 0
      state.page = 1
      state.pageSize = 10
      state.search = ''
      state.sortBy = ''
      state.sortOrder = 'asc'
      state.loading = false
      state.error = null
    },
    setParams: (state, action) => {
      Object.assign(state, action.payload)
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMortality.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMortality.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchMortality.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { clearMortality, setParams } = mortalitySlice.actions

export default mortalitySlice.reducer
