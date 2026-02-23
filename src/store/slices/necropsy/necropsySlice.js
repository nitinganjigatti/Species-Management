import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getAnimalWiseNecropsyList,
  getSpeciesWiseNecropsyList,
  getNecropsyStats,
  getNecropsyListing
} from 'src/lib/api/necropsy'

// Async thunk to fetch necropsy centers list
export const fetchNecropsieCenters = createAsyncThunk(
  'necropsy/fetchCenters',
  async ({ userId, searchQuery = '' }, { rejectWithValue }) => {
    try {
      const params = {
        q: searchQuery?.trim(),
        has_permission: 1
      }
      const response = await getNecropsyListing(params, userId)

      if (response?.status) {
        return response.data.list || []
      }
      throw new Error(response?.message || 'Failed to fetch necropsies')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch necropsy centers')
    }
  }
)

// Async thunk to fetch necropsy stats
export const fetchNecropsyStats = createAsyncThunk('necropsy/fetchStats', async (params, { rejectWithValue }) => {
  try {
    const response = await getNecropsyStats(params)

    if (response?.success) {
      const stats = response?.data?.result || {}

      return {
        INCOMING: Number(stats.incoming_count || 0),
        PENDING: Number(stats.pending_count || 0),
        DRAFT: Number(stats.draft_count || 0),
        COMPLETED: Number(stats.completed_count || 0),
        CARCASS_TRANSFER: Number(stats.transfer_count || 0)
      }
    }
    throw new Error('Failed to fetch stats')
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch necropsy stats')
  }
})

// Async thunk to fetch animal-wise necropsy list
export const fetchAnimalWiseList = createAsyncThunk(
  'necropsy/fetchAnimalWiseList',
  async (params, { rejectWithValue, signal }) => {
    try {
      const response = await getAnimalWiseNecropsyList(params)

      if (response?.success) {
        return {
          list: response?.data?.result || [],
          total: response?.data?.total_count || 0
        }
      }
      throw new Error('Failed to fetch animal list')
    } catch (error) {
      if (error.name === 'AbortError') {
        return rejectWithValue('Request cancelled')
      }

      return rejectWithValue(error.message || 'Failed to fetch animal list')
    }
  }
)

// Async thunk to fetch species-wise necropsy list
export const fetchSpeciesWiseList = createAsyncThunk(
  'necropsy/fetchSpeciesWiseList',
  async (params, { rejectWithValue }) => {
    try {
      const response = await getSpeciesWiseNecropsyList(params)

      if (response?.success) {
        return {
          list: response?.data?.result || [],
          total: response?.data?.total_count || 0
        }
      }
      throw new Error('Failed to fetch species list')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch species list')
    }
  }
)

// Async thunk to fetch both stats and list in parallel
export const fetchNecropsyData = createAsyncThunk(
  'necropsy/fetchData',
  async ({ statsParams, listParams, viewType }, { dispatch, rejectWithValue }) => {
    try {
      const promises = [dispatch(fetchNecropsyStats(statsParams)).unwrap()]

      if (viewType === 'animals') {
        promises.push(dispatch(fetchAnimalWiseList(listParams)).unwrap())
      } else {
        promises.push(dispatch(fetchSpeciesWiseList(listParams)).unwrap())
      }

      await Promise.all(promises)

      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch necropsy data')
    }
  }
)

const initialState = {
  // Selected necropsy center
  selectedCenter: null,

  // Necropsy centers list
  centers: [],
  centersLoading: false,
  centersError: null,
  hasCompletedInitialFetch: false,
  hasNoNecropsiesOnInitialFetch: false,

  // Stats
  stats: {
    INCOMING: 0,
    PENDING: 0,
    DRAFT: 0,
    COMPLETED: 0,
    CARCASS_TRANSFER: 0
  },
  statsLoading: false,
  statsError: null,

  // Animal list
  animalList: [],
  animalTotal: 0,
  animalLoading: false,
  animalError: null,

  // Species list
  speciesList: [],
  speciesTotal: 0,
  speciesLoading: false,
  speciesError: null,

  // UI state
  activeCard: 'INCOMING',
  viewType: 'animals', // 'animals' | 'species'

  // Filters
  filters: {
    page: 1,
    limit: 50,
    q: ''
  },

  // Date filter
  filterDate: {
    startDate: null,
    endDate: null
  },

  // Animal filters
  animalFilters: {
    Sex: [],
    Site: [],
    Priority: '',
    'Necropsy Location': [],
    'Necropsy Conducted By': [],
    'Created By': []
  },

  // Species filters
  speciesFilters: {
    Site: [],
    Priority: ''
  },

  // Request tracking for cancellation
  lastRequestId: null
}

const necropsySlice = createSlice({
  name: 'necropsy',
  initialState,
  reducers: {
    setSelectedCenter: (state, action) => {
      const prevCenterId = state.selectedCenter?.id
      const newCenterId = action.payload?.id

      state.selectedCenter = action.payload

      // Clear lists and reset pagination when center changes
      if (prevCenterId !== newCenterId) {
        state.animalList = []
        state.speciesList = []
        state.animalTotal = 0
        state.speciesTotal = 0
        state.filters.page = 1
        state.stats = {
          INCOMING: 0,
          PENDING: 0,
          DRAFT: 0,
          COMPLETED: 0,
          CARCASS_TRANSFER: 0
        }
      }

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedNecropsy', JSON.stringify(action.payload))
      }
    },

    loadSelectedCenterFromStorage: state => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('selectedNecropsy')
        if (stored) {
          try {
            state.selectedCenter = JSON.parse(stored)
          } catch (e) {
            console.error('Failed to parse stored necropsy center')
          }
        }
      }
    },

    setActiveCard: (state, action) => {
      state.activeCard = action.payload
    },

    setViewType: (state, action) => {
      state.viewType = action.payload
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    setFilterDate: (state, action) => {
      state.filterDate = action.payload
    },

    setAnimalFilters: (state, action) => {
      state.animalFilters = action.payload
    },

    setSpeciesFilters: (state, action) => {
      state.speciesFilters = action.payload
    },

    resetFilters: state => {
      state.filters = initialState.filters
      state.animalFilters = initialState.animalFilters
      state.speciesFilters = initialState.speciesFilters
    },

    resetPage: state => {
      state.filters.page = 1
    },

    clearNecropsyData: state => {
      state.selectedCenter = null
      state.centers = []
      state.hasNoNecropsiesOnInitialFetch = false
      state.hasCompletedInitialFetch = false
      state.animalList = []
      state.speciesList = []
      state.stats = initialState.stats
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedNecropsy')
      }
    },

    clearLists: state => {
      state.animalList = []
      state.speciesList = []
      state.animalTotal = 0
      state.speciesTotal = 0
    }
  },
  extraReducers: builder => {
    builder

      // Fetch centers
      .addCase(fetchNecropsieCenters.pending, state => {
        state.centersLoading = true
        state.centersError = null
      })
      .addCase(fetchNecropsieCenters.fulfilled, (state, action) => {
        state.centersLoading = false
        state.centers = action.payload

        // Track initial fetch
        if (!state.hasCompletedInitialFetch && !action.meta.arg.searchQuery?.trim()) {
          state.hasCompletedInitialFetch = true
          state.hasNoNecropsiesOnInitialFetch = action.payload.length === 0
        }
      })
      .addCase(fetchNecropsieCenters.rejected, (state, action) => {
        state.centersLoading = false
        state.centersError = action.payload
      })

      // Fetch stats
      .addCase(fetchNecropsyStats.pending, state => {
        state.statsLoading = true
        state.statsError = null
      })
      .addCase(fetchNecropsyStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.stats = action.payload
      })
      .addCase(fetchNecropsyStats.rejected, (state, action) => {
        state.statsLoading = false
        state.statsError = action.payload
      })

      // Fetch animal list
      .addCase(fetchAnimalWiseList.pending, state => {
        state.animalLoading = true
        state.animalError = null
      })
      .addCase(fetchAnimalWiseList.fulfilled, (state, action) => {
        state.animalLoading = false
        state.animalList = action.payload.list
        state.animalTotal = action.payload.total
      })
      .addCase(fetchAnimalWiseList.rejected, (state, action) => {
        state.animalLoading = false
        if (action.payload !== 'Request cancelled') {
          state.animalError = action.payload
        }
      })

      // Fetch species list
      .addCase(fetchSpeciesWiseList.pending, state => {
        state.speciesLoading = true
        state.speciesError = null
      })
      .addCase(fetchSpeciesWiseList.fulfilled, (state, action) => {
        state.speciesLoading = false
        state.speciesList = action.payload.list
        state.speciesTotal = action.payload.total
      })
      .addCase(fetchSpeciesWiseList.rejected, (state, action) => {
        state.speciesLoading = false
        state.speciesError = action.payload
      })
  }
})

export const {
  setSelectedCenter,
  loadSelectedCenterFromStorage,
  setActiveCard,
  setViewType,
  setFilters,
  setFilterDate,
  setAnimalFilters,
  setSpeciesFilters,
  resetFilters,
  resetPage,
  clearNecropsyData,
  clearLists
} = necropsySlice.actions

// Selectors
export const selectSelectedCenter = state => state.necropsy.selectedCenter

export const selectCenters = state => state.necropsy.centers

export const selectCentersLoading = state => state.necropsy.centersLoading

export const selectStats = state => state.necropsy.stats

export const selectStatsLoading = state => state.necropsy.statsLoading

export const selectAnimalList = state => state.necropsy.animalList

export const selectAnimalTotal = state => state.necropsy.animalTotal

export const selectAnimalLoading = state => state.necropsy.animalLoading

export const selectSpeciesList = state => state.necropsy.speciesList

export const selectSpeciesTotal = state => state.necropsy.speciesTotal

export const selectSpeciesLoading = state => state.necropsy.speciesLoading

export const selectActiveCard = state => state.necropsy.activeCard

export const selectViewType = state => state.necropsy.viewType

export const selectFilters = state => state.necropsy.filters

export const selectFilterDate = state => state.necropsy.filterDate

export const selectAnimalFilters = state => state.necropsy.animalFilters

export const selectSpeciesFilters = state => state.necropsy.speciesFilters

// Combined loading selector
export const selectIsLoading = state => state.necropsy.animalLoading || state.necropsy.speciesLoading

// Get current list based on view type
export const selectCurrentList = state =>
  state.necropsy.viewType === 'animals' ? state.necropsy.animalList : state.necropsy.speciesList

export const selectCurrentTotal = state =>
  state.necropsy.viewType === 'animals' ? state.necropsy.animalTotal : state.necropsy.speciesTotal

export default necropsySlice.reducer
