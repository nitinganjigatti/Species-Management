import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllSites } from 'src/lib/api/housing'

// Async thunk to fetch sites with pagination
export const fetchSites = createAsyncThunk('site-list', async (_, { getState, rejectWithValue }) => {
  const { page, pageSize, search, sortBy, sortOrder } = getState().sites

  try {
    const response = await getAllSites({
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
    error: null,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  },
  reducers: {
    clearSites: state => {
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

export const { clearSites, setParams } = sitesSlice.actions

export default sitesSlice.reducer
