import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getAllAnimalList } from 'src/lib/api/housing'
import type {
  Animal,
  AnimalInfiniteScrollState,
  FetchListResult,
  GetAnimalsParams,
  SortOrder
} from 'src/types/housing'

interface RootState {
  animalInfiniteScroll: AnimalInfiniteScrollState
}

export const fetchAnimalPages = createAsyncThunk<
  FetchListResult<Animal>,
  Partial<GetAnimalsParams> | undefined,
  { state: RootState; rejectValue: string }
>('animalInfiniteScroll/fetchAnimalPages', async (params, { getState, rejectWithValue }) => {
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
      list: response?.data?.result || [],
      total: response?.data?.total_count || 0
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch animals')
  }
})

const initialState: AnimalInfiniteScrollState = {
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,
  search: '',
  sortBy: '',
  sortOrder: 'asc' as SortOrder,
  hasMore: true
}

const animalInfiniteScrollSlice = createSlice({
  name: 'animalInfiniteScroll',
  initialState,
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
    updateAnimalSearch: (state, action: PayloadAction<string>) => {
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
      .addCase(fetchAnimalPages.fulfilled, (state, action: PayloadAction<FetchListResult<Animal>>) => {
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
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { resetAnimalInfiniteScroll, updateAnimalSearch } = animalInfiniteScrollSlice.actions

export default animalInfiniteScrollSlice.reducer
