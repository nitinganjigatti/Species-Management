// src/store/slices/housing/sitesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllSpeciesList } from 'src/lib/api/housing'

// Async thunk to fetch sites with pagination
export const fetchSpecies = createAsyncThunk('listing', async (params, { rejectWithValue }) => {
  try {
    debugger
    const response = await getAllSpeciesList(params)

    return {
      list: response.data.listing,
      total: response.data.total_count
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch sites')
  }
})

const SpeciesSlice = createSlice({
  name: 'species',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null
  },
  reducers: {
    clearSpecies: state => {
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
      .addCase(fetchSpecies.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSpecies.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchSpecies.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { clearSpecies, setPagination } = SpeciesSlice.actions

export default SpeciesSlice.reducer
