import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getAllSpeciesList } from 'src/lib/api/housing'
import type {
  Species,
  SpeciesState,
  FetchListResult,
  SetParamsPayload,
  GetSpeciesParams,
  SortOrder
} from 'src/types/housing'

interface RootState {
  species: SpeciesState
}

// Async thunk to fetch species with pagination
export const fetchSpecies = createAsyncThunk<
  FetchListResult<Species>,
  Partial<GetSpeciesParams> | undefined,
  { state: RootState; rejectValue: string }
>('species-list', async (params, { getState, rejectWithValue }) => {
  const { page, pageSize, search, sortBy, sortOrder } = getState().species

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
    const err = error as { response?: { data?: { message?: string } } }

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch species')
  }
})

const initialState: SpeciesState = {
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

const speciesSlice = createSlice({
  name: 'species',
  initialState,
  reducers: {
    clearSpecies: state => {
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
      .addCase(fetchSpecies.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSpecies.fulfilled, (state, action: PayloadAction<FetchListResult<Species>>) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchSpecies.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { clearSpecies, setParams } = speciesSlice.actions

export default speciesSlice.reducer
