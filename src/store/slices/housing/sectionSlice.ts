import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getAllSections } from 'src/lib/api/housing'
import type {
  Section,
  SectionState,
  FetchListResult,
  SetParamsPayload,
  GetSectionsParams,
  SortOrder
} from 'src/types/housing'

interface RootState {
  section: SectionState
}

// Async thunk to fetch sections with pagination
export const fetchSections = createAsyncThunk<
  FetchListResult<Section>,
  Partial<GetSectionsParams> | undefined,
  { state: RootState; rejectValue: string }
>('section-list', async (params, { getState, rejectWithValue }) => {
  const { page, pageSize, search, sortBy, sortOrder } = getState().section

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

const initialState: SectionState = {
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,
  search: '',
  sortBy: '',
  sortOrder: 'asc' as SortOrder
}

const sectionSlice = createSlice({
  name: 'section',
  initialState,
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
    setParams: (state, action: PayloadAction<Partial<SetParamsPayload>>) => {
      Object.assign(state, action.payload)
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSections.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSections.fulfilled, (state, action: PayloadAction<FetchListResult<Section>>) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { clearSection, setParams } = sectionSlice.actions

export default sectionSlice.reducer
