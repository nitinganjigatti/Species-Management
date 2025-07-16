// src/store/slices/housing/animalInfiniteScrollSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllAnimalList } from 'src/lib/api/housing'

export const fetchAnimalPages = createAsyncThunk(
  'animalInfiniteScroll/fetchAnimalPages',
  async (params, { getState, rejectWithValue }) => {
    const state = getState().animalInfiniteScroll
    const { page, pageSize, search, sortBy, sortOrder } = state
    try {
      const response = await getAllAnimalList({
        page_no: page,
        limit: pageSize,
        q: search,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...params
      })

      return {
        list: response?.data || [],
        total: response?.total_count || 0
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch animals')
    }
  }
)

const animalInfiniteScrollSlice = createSlice({
  name: 'animalInfiniteScroll',
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
    resetAnimalInfiniteScroll: state => {
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
    updateAnimalSearch: (state, action) => {
      state.search = action.payload
      state.page = 1
      state.list = []
      state.hasMore = true
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAnimalPages.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnimalPages.fulfilled, (state, action) => {
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
      .addCase(fetchAnimalPages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { resetAnimalInfiniteScroll, updateAnimalSearch } = animalInfiniteScrollSlice.actions

export default animalInfiniteScrollSlice.reducer
