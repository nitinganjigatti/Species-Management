import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getMannerOfDeath, getCarcassDisposition, getMeasurementUnits } from 'src/lib/api/necropsy'
import type {
  FormOptionsState,
  SelectOption,
  WeightUnitOption,
  FetchFormOptionsResult
} from 'src/types/necropsy'

// Define the RootState type locally for selectors
interface RootState {
  necropsyFormOptions: FormOptionsState
}

// Async thunk to fetch all form options in parallel
export const fetchFormOptions = createAsyncThunk<
  FetchFormOptionsResult,
  void,
  { state: RootState; rejectValue: string }
>(
  'necropsyFormOptions/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const { necropsyFormOptions } = getState()

    // Return cached data if already loaded
    if (necropsyFormOptions.isLoaded) {
      return {
        mannerOfDeathOptions: necropsyFormOptions.mannerOfDeathOptions,
        disposalOptions: necropsyFormOptions.disposalOptions,
        weightUnitOptions: necropsyFormOptions.weightUnitOptions,
        cached: true
      }
    }

    try {
      const [mannerRes, disposalRes, measurementRes] = await Promise.all([
        getMannerOfDeath(),
        getCarcassDisposition(),
        getMeasurementUnits()
      ])

      // Process manner of death options
      let mannerOfDeathOptions: SelectOption[] = []
      if (mannerRes?.data) {
        const data = mannerRes.data as
          | SelectOption[]
          | { result?: Array<{ id?: number | string; string_id?: string; name?: string; label?: string; value?: string | number }> }

        const dataArray = Array.isArray(data) ? data : (data?.result || [])
        mannerOfDeathOptions = dataArray.map(
          (item: { id?: number | string; string_id?: string; name?: string; label?: string; value?: string | number }) => ({
            label: item.name || item.label || '',
            value: item.id || item.string_id || item.value || '',
            key: item.name || item.label || ''
          })
        )
      }

      // Process disposal options
      let disposalOptions: SelectOption[] = []
      if (disposalRes?.data) {
        const data = disposalRes.data as
          | SelectOption[]
          | { result?: Array<{ id?: number | string; string_id?: string; name?: string; label?: string; value?: string | number }> }

        const dataArray = Array.isArray(data) ? data : (data?.result || [])
        disposalOptions = dataArray.map(
          (item: { id?: number | string; string_id?: string; name?: string; label?: string; value?: string | number }) => ({
            label: item.name || item.label || '',
            value: item.id || item.string_id || item.value || '',
            key: item.name || item.label || ''
          })
        )
      }

      // Process weight unit options
      let weightUnitOptions: WeightUnitOption[] = []
      if (measurementRes?.success && Array.isArray(measurementRes.data)) {
        weightUnitOptions = measurementRes.data
          .filter((item) => item?.measurement_type === 'weight')
          .map((item) => ({
            id: item.id,
            label: item.uom_abbr || item.unit_name || '',
            value: item.uom_abbr || item.unit_name || '',
            unit_name: item.unit_name,
            uom_abbr: item.uom_abbr
          }))
      }

      return {
        mannerOfDeathOptions,
        disposalOptions,
        weightUnitOptions,
        cached: false
      }
    } catch (error) {
      const err = error as Error

      return rejectWithValue(err.message || 'Failed to fetch form options')
    }
  }
)

// Async thunk to fetch manner of death options only
export const fetchMannerOfDeathOptions = createAsyncThunk<
  SelectOption[],
  void,
  { state: RootState; rejectValue: string }
>(
  'necropsyFormOptions/fetchMannerOfDeath',
  async (_, { getState, rejectWithValue }) => {
    const { necropsyFormOptions } = getState()

    // Return cached data if already loaded
    if (necropsyFormOptions.mannerOfDeathOptions.length > 0) {
      return necropsyFormOptions.mannerOfDeathOptions
    }

    try {
      const response = await getMannerOfDeath()

      if (response?.data) {
        const data = response.data as
          | SelectOption[]
          | { result?: Array<{ id?: number | string; string_id?: string; name?: string; label?: string; value?: string | number }> }

        const dataArray = Array.isArray(data) ? data : (data?.result || [])

        return dataArray.map(
          (item: { id?: number | string; string_id?: string; name?: string; label?: string; value?: string | number }) => ({
            label: item.name || item.label || '',
            value: item.id || item.string_id || item.value || '',
            key: item.name || item.label || ''
          })
        )
      }

      return []
    } catch (error) {
      const err = error as Error

      return rejectWithValue(err.message || 'Failed to fetch manner of death options')
    }
  }
)

// Async thunk to fetch disposal options only
export const fetchDisposalOptions = createAsyncThunk<
  SelectOption[],
  void,
  { state: RootState; rejectValue: string }
>(
  'necropsyFormOptions/fetchDisposal',
  async (_, { getState, rejectWithValue }) => {
    const { necropsyFormOptions } = getState()

    // Return cached data if already loaded
    if (necropsyFormOptions.disposalOptions.length > 0) {
      return necropsyFormOptions.disposalOptions
    }

    try {
      const response = await getCarcassDisposition()

      if (response?.data) {
        const data = response.data as
          | SelectOption[]
          | { result?: Array<{ id?: number | string; string_id?: string; name?: string; label?: string; value?: string | number }> }

        const dataArray = Array.isArray(data) ? data : (data?.result || [])

        return dataArray.map(
          (item: { id?: number | string; string_id?: string; name?: string; label?: string; value?: string | number }) => ({
            label: item.name || item.label || '',
            value: item.id || item.string_id || item.value || '',
            key: item.name || item.label || ''
          })
        )
      }

      return []
    } catch (error) {
      const err = error as Error

      return rejectWithValue(err.message || 'Failed to fetch disposal options')
    }
  }
)

// Async thunk to fetch weight unit options only
export const fetchWeightUnitOptions = createAsyncThunk<
  WeightUnitOption[],
  void,
  { state: RootState; rejectValue: string }
>(
  'necropsyFormOptions/fetchWeightUnits',
  async (_, { getState, rejectWithValue }) => {
    const { necropsyFormOptions } = getState()

    // Return cached data if already loaded
    if (necropsyFormOptions.weightUnitOptions.length > 0) {
      return necropsyFormOptions.weightUnitOptions
    }

    try {
      const response = await getMeasurementUnits()

      if (response?.success && Array.isArray(response.data)) {
        return response.data
          .filter((item) => item?.measurement_type === 'weight')
          .map((item) => ({
            id: item.id,
            label: item.uom_abbr || item.unit_name || '',
            value: item.uom_abbr || item.unit_name || '',
            unit_name: item.unit_name,
            uom_abbr: item.uom_abbr
          }))
      }

      return []
    } catch (error) {
      const err = error as Error

      return rejectWithValue(err.message || 'Failed to fetch weight unit options')
    }
  }
)

const initialState: FormOptionsState = {
  mannerOfDeathOptions: [],
  disposalOptions: [],
  weightUnitOptions: [],
  loading: false,
  error: null,
  isLoaded: false,
  lastFetchTime: null
}

const necropsyFormOptionsSlice = createSlice({
  name: 'necropsyFormOptions',
  initialState,
  reducers: {
    clearFormOptions: (state) => {
      state.mannerOfDeathOptions = []
      state.disposalOptions = []
      state.weightUnitOptions = []
      state.isLoaded = false
      state.lastFetchTime = null
    },
    invalidateCache: (state) => {
      state.isLoaded = false
      state.lastFetchTime = null
    }
  },
  extraReducers: (builder) => {
    builder

      // Fetch all form options
      .addCase(fetchFormOptions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFormOptions.fulfilled, (state, action) => {
        state.loading = false

        if (!action.payload.cached) {
          state.mannerOfDeathOptions = action.payload.mannerOfDeathOptions
          state.disposalOptions = action.payload.disposalOptions
          state.weightUnitOptions = action.payload.weightUnitOptions
          state.lastFetchTime = Date.now()
        }

        state.isLoaded = true
      })
      .addCase(fetchFormOptions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? null
      })

      // Fetch manner of death options
      .addCase(fetchMannerOfDeathOptions.fulfilled, (state, action) => {
        state.mannerOfDeathOptions = action.payload
      })

      // Fetch disposal options
      .addCase(fetchDisposalOptions.fulfilled, (state, action) => {
        state.disposalOptions = action.payload
      })

      // Fetch weight unit options
      .addCase(fetchWeightUnitOptions.fulfilled, (state, action) => {
        state.weightUnitOptions = action.payload
      })
  }
})

export const { clearFormOptions, invalidateCache } = necropsyFormOptionsSlice.actions

// Selectors
export const selectMannerOfDeathOptions = (state: RootState): SelectOption[] =>
  state.necropsyFormOptions.mannerOfDeathOptions

export const selectDisposalOptions = (state: RootState): SelectOption[] =>
  state.necropsyFormOptions.disposalOptions

export const selectWeightUnitOptions = (state: RootState): WeightUnitOption[] =>
  state.necropsyFormOptions.weightUnitOptions

export const selectFormOptionsLoading = (state: RootState): boolean =>
  state.necropsyFormOptions.loading

export const selectFormOptionsLoaded = (state: RootState): boolean =>
  state.necropsyFormOptions.isLoaded

export const selectFormOptionsError = (state: RootState): string | null =>
  state.necropsyFormOptions.error

// Check if cache is stale (older than 5 minutes)
export const selectIsCacheStale = (state: RootState): boolean => {
  const { lastFetchTime } = state.necropsyFormOptions
  if (!lastFetchTime) return true
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  return Date.now() - lastFetchTime > CACHE_DURATION
}

export default necropsyFormOptionsSlice.reducer
