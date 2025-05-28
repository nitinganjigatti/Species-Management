// src/store/slices/housing/sectionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllSections } from 'src/lib/api/housing'

// Async thunk to fetch sections with pagination
export const fetchSections = createAsyncThunk('section-list', async (params, { getState, rejectWithValue }) => {
  const state = getState().section
  const { page, search, sortBy, sortOrder, pageSize } = state
  const cacheKey = `${params.site_id}${search}_${sortBy}_${sortOrder}_${page}`

  // Return cached data if already present
  if (state.pages[cacheKey]) {
    return {
      list: state.pages[cacheKey],
      total: state.total,
      fromCache: true
    }
  }

  try {
    const response = await getAllSections({
      page_no: page,
      limit: pageSize,
      q: search,
      sort_by: sortBy,
      sort_order: sortOrder,
      ...params
    })

    return {
      list: response?.data?.result || [],
      total: response?.data?.total_count || 0,
      cacheKey
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch sections')
  }
})

const sectionSlice = createSlice({
  name: 'section',
  initialState: {
    pages: {},
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
      state.pages = {}
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
        const { list, total, fromCache, cacheKey } = action.payload

        if (!fromCache && cacheKey) {
          state.pages[cacheKey] = list
        }

        state.total = total
        state.loading = false
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { clearSection, setParams } = sectionSlice.actions

export default sectionSlice.reducer
