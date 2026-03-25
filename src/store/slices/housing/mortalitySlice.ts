import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getMortalityList } from 'src/lib/api/housing'
import type {
  Mortality,
  MortalityState,
  FetchListResult,
  SetParamsPayload,
  GetMortalityListParams,
  SortOrder
} from 'src/types/housing'

interface RootState {
  mortality: MortalityState
}

// Async thunk to fetch mortality with pagination
export const fetchMortality = createAsyncThunk<
  FetchListResult<Mortality>,
  Partial<GetMortalityListParams> | undefined,
  { state: RootState; rejectValue: string }
>('mortality-list', async (params, { getState, rejectWithValue }) => {
  const { page, pageSize, search, sortBy, sortOrder } = getState().mortality

  try {
    const response = await getMortalityList({
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

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch mortality')
  }
})

const initialState: MortalityState = {
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

const mortalitySlice = createSlice({
  name: 'mortality',
  initialState,
  reducers: {
    clearMortality: state => {
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
      .addCase(fetchMortality.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMortality.fulfilled, (state, action: PayloadAction<FetchListResult<Mortality>>) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchMortality.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { clearMortality, setParams } = mortalitySlice.actions

export default mortalitySlice.reducer
