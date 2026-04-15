import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getAnimalTreatmentList } from 'src/lib/api/housing'
import type {
  Treatment,
  AnimalTreatmentState,
  FetchListResult,
  SetParamsPayload,
  GetAnimalTreatmentListParams,
  SortOrder
} from 'src/types/housing'

interface RootState {
  animalTreatment: AnimalTreatmentState
}

// Async thunk to fetch animal treatments with pagination
export const fetchAnimals = createAsyncThunk<
  FetchListResult<Treatment>,
  Partial<GetAnimalTreatmentListParams> | undefined,
  { state: RootState; rejectValue: string }
>('animal-treatment', async (params, { getState, rejectWithValue }) => {
  const { page, pageSize, search, sortBy, sortOrder } = getState().animalTreatment

  try {
    const response = await getAnimalTreatmentList({
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

    return rejectWithValue(err.response?.data?.message || 'Failed to fetch treatments')
  }
})

const initialState: AnimalTreatmentState = {
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

const animalTreatmentSlice = createSlice({
  name: 'animalTreatment',
  initialState,
  reducers: {
    clearanimalTreatment: state => {
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
      .addCase(fetchAnimals.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnimals.fulfilled, (state, action: PayloadAction<FetchListResult<Treatment>>) => {
        state.loading = false
        state.list = action.payload.list
        state.total = action.payload.total
      })
      .addCase(fetchAnimals.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message || null
      })
  }
})

export const { clearanimalTreatment, setParams } = animalTreatmentSlice.actions

export default animalTreatmentSlice.reducer
