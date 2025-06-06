// src/store/slices/housing/sectionInfiniteScrollSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllSections } from 'src/lib/api/housing'

export const fetchSectionPages = createAsyncThunk(
  'sectionInfiniteScroll/fetchSectionPages',
  async (params, { getState, rejectWithValue }) => {
    const state = getState().sectionInfiniteScroll
    const { page, pageSize, search, sortBy, sortOrder } = state

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
        total: response?.data?.total_count || 0
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sections')
    }
  }
)

const sectionInfiniteScrollSlice = createSlice({
  name: 'sectionInfiniteScroll',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null,
    search: '',
    sortBy: '',
    sortOrder: 'asc',
    hasMore: true
  },
  reducers: {
    resetSectionInfiniteScroll: state => {
      state.list = []
      state.total = 0
      state.page = 1
      state.search = ''
      state.sortBy = ''
      state.sortOrder = 'asc'
      state.hasMore = true
      state.loading = false
      state.error = null
    },
    updateSectionSearch: (state, action) => {
      state.search = action.payload
      state.page = 1
      state.list = []
      state.hasMore = true
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSectionPages.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSectionPages.fulfilled, (state, action) => {
        const { list, total } = action.payload
        state.loading = false
        state.total = total

        if (state.page === 1) {
          state.list = list
        } else {
          state.list = [...state.list, ...list]
        }

        if (list.length < state.pageSize) {
          state.hasMore = false
        } else {
          state.page += 1
        }
      })
      .addCase(fetchSectionPages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { resetSectionInfiniteScroll, updateSectionSearch } = sectionInfiniteScrollSlice.actions

export default sectionInfiniteScrollSlice.reducer
