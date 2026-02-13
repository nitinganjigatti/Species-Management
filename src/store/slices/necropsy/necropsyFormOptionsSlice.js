import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getMannerOfDeath, getCarcassDisposition, getMeasurementUnits } from 'src/lib/api/necropsy'

// Async thunk to fetch all form options in parallel
export const fetchFormOptions = createAsyncThunk(
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
      let mannerOfDeathOptions = []
      if (mannerRes?.data) {
        mannerOfDeathOptions = (Array.isArray(mannerRes.data) ? mannerRes.data : mannerRes.data?.result || []).map(
          item => ({
            label: item.name || item.label,
            value: item.id || item.string_id || item.value,
            key: item.name || item.label
          })
        )
      }

      // Process disposal options
      let disposalOptions = []
      if (disposalRes?.data) {
        disposalOptions = (Array.isArray(disposalRes.data) ? disposalRes.data : disposalRes.data?.result || []).map(
          item => ({
            label: item.name || item.label,
            value: item.id || item.string_id || item.value,
            key: item.name || item.label
          })
        )
      }

      // Process weight unit options
      let weightUnitOptions = []
      if (measurementRes?.success && Array.isArray(measurementRes.data)) {
        weightUnitOptions = measurementRes.data
          .filter(item => item?.measurement_type === 'weight')
          .map(item => ({
            id: item.id,
            label: item.uom_abbr || item.unit_name || item.name,
            value: item.uom_abbr || item.unit_name || item.name,
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
      return rejectWithValue(error.message || 'Failed to fetch form options')
    }
  }
)

// Async thunk to fetch manner of death options only
export const fetchMannerOfDeathOptions = createAsyncThunk(
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
        return (Array.isArray(response.data) ? response.data : response.data?.result || []).map(item => ({
          label: item.name || item.label,
          value: item.id || item.string_id || item.value,
          key: item.name || item.label
        }))
      }

      return []
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch manner of death options')
    }
  }
)

// Async thunk to fetch disposal options only
export const fetchDisposalOptions = createAsyncThunk(
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
        return (Array.isArray(response.data) ? response.data : response.data?.result || []).map(item => ({
          label: item.name || item.label,
          value: item.id || item.string_id || item.value,
          key: item.name || item.label
        }))
      }

      return []
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch disposal options')
    }
  }
)

// Async thunk to fetch weight unit options only
export const fetchWeightUnitOptions = createAsyncThunk(
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
          .filter(item => item?.measurement_type === 'weight')
          .map(item => ({
            id: item.id,
            label: item.uom_abbr || item.unit_name || item.name,
            value: item.uom_abbr || item.unit_name || item.name,
            unit_name: item.unit_name,
            uom_abbr: item.uom_abbr
          }))
      }

      return []
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch weight unit options')
    }
  }
)

const initialState = {
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
    clearFormOptions: state => {
      state.mannerOfDeathOptions = []
      state.disposalOptions = []
      state.weightUnitOptions = []
      state.isLoaded = false
      state.lastFetchTime = null
    },
    invalidateCache: state => {
      state.isLoaded = false
      state.lastFetchTime = null
    }
  },
  extraReducers: builder => {
    builder

      // Fetch all form options
      .addCase(fetchFormOptions.pending, state => {
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
        state.error = action.payload
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
export const selectMannerOfDeathOptions = state => state.necropsyFormOptions.mannerOfDeathOptions

export const selectDisposalOptions = state => state.necropsyFormOptions.disposalOptions

export const selectWeightUnitOptions = state => state.necropsyFormOptions.weightUnitOptions

export const selectFormOptionsLoading = state => state.necropsyFormOptions.loading

export const selectFormOptionsLoaded = state => state.necropsyFormOptions.isLoaded

export const selectFormOptionsError = state => state.necropsyFormOptions.error

// Check if cache is stale (older than 5 minutes)
export const selectIsCacheStale = state => {
  const { lastFetchTime } = state.necropsyFormOptions
  if (!lastFetchTime) return true
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  return Date.now() - lastFetchTime > CACHE_DURATION
}

export default necropsyFormOptionsSlice.reducer
