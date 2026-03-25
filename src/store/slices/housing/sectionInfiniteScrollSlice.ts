import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getAllSections } from 'src/lib/api/housing'
import type {
  Section,
  SectionInfiniteScrollState,
  FetchListResult,
  GetSectionsParams,
  SortOrder
} from 'src/types/housing'

interface RootState {
  sectionInfiniteScroll: SectionInfiniteScrollState
}

export const fetchSectionPages = createAsyncThunk<
  FetchListResult<Section>,
  Partial<GetSectionsParams> | undefined,
  { state: RootState; rejectValue: string }
>('sectionInfiniteScroll/fetchSectionPages', async (params, { getState, rejectWithValue }) => {
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
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch sections')
  }
})

const initialState: SectionInfiniteScrollState = {
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

const sectionInfiniteScrollSlice = createSlice({
  name: 'sectionInfiniteScroll',
  initialState,
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
    updateSectionSearch: (state, action: PayloadAction<string>) => {
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
      .addCase(fetchSectionPages.fulfilled, (state, action: PayloadAction<FetchListResult<Section>>) => {
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
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { resetSectionInfiniteScroll, updateSectionSearch } = sectionInfiniteScrollSlice.actions

export default sectionInfiniteScrollSlice.reducer
