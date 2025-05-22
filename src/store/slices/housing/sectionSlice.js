// src/store/slices/housing/sectionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllSections } from 'src/lib/api/housing'

// Async thunk to fetch sections with pagination
export const fetchSections = createAsyncThunk(
  'section-list',
  async (_, { getState, rejectWithValue }) => {
    const { page, pageSize, search, sortBy, sortOrder } = getState().section

    try {
      const response = await getAllSections({
        page_no: page,
        limit: pageSize,
        q: search,
        sort_by: sortBy,
        sort_order: sortOrder
      })

      return {
        list: response.data.result,
        total: response.data.total_count
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sections')
    }
  }
)

const sectionSlice = createSlice({
  name: 'section',
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
    clearSection: state => {
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
      .addCase(fetchSections.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { clearSection, setParams } = sectionSlice.actions

export default sectionSlice.reducer
