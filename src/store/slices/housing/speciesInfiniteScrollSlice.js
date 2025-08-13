import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAllSpeciesList } from 'src/lib/api/housing' // ✅ Adjust path if needed

export const fetchSpeciesPages = createAsyncThunk(
  'speciesInfiniteScroll/fetchSpeciesPages',
  async (params, { getState, rejectWithValue }) => {
    const state = getState().speciesInfiniteScroll
    const { page, pageSize, search, sortBy, sortOrder } = state

    try {
      const response = await getAllSpeciesList({
        page_no: page,
        limit: pageSize,
        q: search,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...params
      })

      return {
        list: response?.data?.listing || [],
        total: response?.data?.total_scies_count || 0
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch species')
    }
  }
)

const speciesInfiniteScrollSlice = createSlice({
  name: 'speciesInfiniteScroll',
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
    resetSpeciesInfiniteScroll: state => {
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
    updateSpeciesSearch: (state, action) => {
      state.search = action.payload
      state.page = 1
      state.list = []
      state.hasMore = true
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSpeciesPages.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSpeciesPages.fulfilled, (state, action) => {
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
      .addCase(fetchSpeciesPages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  }
})

export const { resetSpeciesInfiniteScroll, updateSpeciesSearch } = speciesInfiniteScrollSlice.actions

export default speciesInfiniteScrollSlice.reducer
