import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  getAnimalWiseNecropsyList,
  getSpeciesWiseNecropsyList,
  getNecropsyStats,
  getNecropsyListing
} from 'src/lib/api/necropsy'
import type {
  NecropsyCenter,
  NecropsyStats,
  AnimalNecropsyItem,
  SpeciesNecropsyItem,
  NecropsyState,
  ViewType,
  ActiveCard,
  NecropsyFilters,
  DateFilter,
  AnimalFilters,
  SpeciesFilters,
  FetchCentersPayload,
  FetchNecropsyDataPayload,
  FetchStatsResult,
  FetchListResult,
  SetFiltersPayload,
  AnimalWiseListParams,
  SpeciesWiseListParams,
  NecropsyStatsParams
} from 'src/types/necropsy'

// Define the RootState type locally for selectors
interface RootState {
  necropsy: NecropsyState
}

// Async thunk to fetch necropsy centers list
export const fetchNecropsieCenters = createAsyncThunk<NecropsyCenter[], FetchCentersPayload, { rejectValue: string }>(
  'necropsy/fetchCenters',
  async ({ userId, searchQuery = '' }, { rejectWithValue }) => {
    try {
      const params = {
        q: searchQuery?.trim(),
        has_permission: 1
      }
      const response = await getNecropsyListing(params, userId)

      if (response?.status) {
        return response.data?.list || []
      }
      throw new Error(response?.message || 'Failed to fetch necropsies')
    } catch (error) {
      const err = error as Error

      return rejectWithValue(err.message || 'Failed to fetch necropsy centers')
    }
  }
)

// Async thunk to fetch necropsy stats
export const fetchNecropsyStats = createAsyncThunk<FetchStatsResult, NecropsyStatsParams, { rejectValue: string }>(
  'necropsy/fetchStats',
  async (params, { rejectWithValue }) => {
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
      const err = error as Error

      return rejectWithValue(err.message || 'Failed to fetch necropsy stats')
    }
  }
)

// Async thunk to fetch animal-wise necropsy list
export const fetchAnimalWiseList = createAsyncThunk<FetchListResult, AnimalWiseListParams, { rejectValue: string }>(
  'necropsy/fetchAnimalWiseList',
  async (params, { rejectWithValue }) => {
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
      const err = error as Error
      if (err.name === 'AbortError') {
        return rejectWithValue('Request cancelled')
      }

      return rejectWithValue(err.message || 'Failed to fetch animal list')
    }
  }
)

// Async thunk to fetch species-wise necropsy list
export const fetchSpeciesWiseList = createAsyncThunk<FetchListResult, SpeciesWiseListParams, { rejectValue: string }>(
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
      const err = error as Error

      return rejectWithValue(err.message || 'Failed to fetch species list')
    }
  }
)

// Async thunk to fetch both stats and list in parallel
export const fetchNecropsyData = createAsyncThunk<
  { success: boolean },
  FetchNecropsyDataPayload,
  { rejectValue: string; dispatch: any }
>('necropsy/fetchData', async ({ statsParams, listParams, viewType }, { dispatch, rejectWithValue }) => {
  try {
    const promises: Promise<unknown>[] = [dispatch(fetchNecropsyStats(statsParams)).unwrap()]

    if (viewType === 'animals') {
      promises.push(dispatch(fetchAnimalWiseList(listParams as AnimalWiseListParams)).unwrap())
    } else {
      promises.push(dispatch(fetchSpeciesWiseList(listParams as SpeciesWiseListParams)).unwrap())
    }

    await Promise.all(promises)

    return { success: true }
  } catch (error) {
    const err = error as Error

    return rejectWithValue(err.message || 'Failed to fetch necropsy data')
  }
})

const initialState: NecropsyState = {
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
  viewType: 'animals',

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
    setSelectedCenter: (state, action: PayloadAction<NecropsyCenter | null>) => {
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

    setActiveCard: (state, action: PayloadAction<ActiveCard>) => {
      state.activeCard = action.payload
    },

    setViewType: (state, action: PayloadAction<ViewType>) => {
      state.viewType = action.payload
    },

    setFilters: (state, action: PayloadAction<SetFiltersPayload>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    setFilterDate: (state, action: PayloadAction<DateFilter>) => {
      state.filterDate = action.payload
    },

    setAnimalFilters: (state, action: PayloadAction<AnimalFilters>) => {
      state.animalFilters = action.payload
    },

    setSpeciesFilters: (state, action: PayloadAction<SpeciesFilters>) => {
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
        state.centersError = action.payload ?? null
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
        state.statsError = action.payload ?? null
      })

      // Fetch animal list
      .addCase(fetchAnimalWiseList.pending, state => {
        state.animalLoading = true
        state.animalError = null
      })
      .addCase(fetchAnimalWiseList.fulfilled, (state, action) => {
        state.animalLoading = false
        state.animalList = action.payload.list as AnimalNecropsyItem[]
        state.animalTotal = action.payload.total
      })
      .addCase(fetchAnimalWiseList.rejected, (state, action) => {
        state.animalLoading = false
        if (action.payload !== 'Request cancelled') {
          state.animalError = action.payload ?? null
        }
      })

      // Fetch species list
      .addCase(fetchSpeciesWiseList.pending, state => {
        state.speciesLoading = true
        state.speciesError = null
      })
      .addCase(fetchSpeciesWiseList.fulfilled, (state, action) => {
        state.speciesLoading = false
        state.speciesList = action.payload.list as SpeciesNecropsyItem[]
        state.speciesTotal = action.payload.total
      })
      .addCase(fetchSpeciesWiseList.rejected, (state, action) => {
        state.speciesLoading = false
        state.speciesError = action.payload ?? null
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
export const selectSelectedCenter = (state: RootState): NecropsyCenter | null => state.necropsy.selectedCenter

export const selectCenters = (state: RootState): NecropsyCenter[] => state.necropsy.centers

export const selectCentersLoading = (state: RootState): boolean => state.necropsy.centersLoading

export const selectStats = (state: RootState): NecropsyStats => state.necropsy.stats

export const selectStatsLoading = (state: RootState): boolean => state.necropsy.statsLoading

export const selectAnimalList = (state: RootState): AnimalNecropsyItem[] => state.necropsy.animalList

export const selectAnimalTotal = (state: RootState): number => state.necropsy.animalTotal

export const selectAnimalLoading = (state: RootState): boolean => state.necropsy.animalLoading

export const selectSpeciesList = (state: RootState): SpeciesNecropsyItem[] => state.necropsy.speciesList

export const selectSpeciesTotal = (state: RootState): number => state.necropsy.speciesTotal

export const selectSpeciesLoading = (state: RootState): boolean => state.necropsy.speciesLoading

export const selectActiveCard = (state: RootState): ActiveCard => state.necropsy.activeCard

export const selectViewType = (state: RootState): ViewType => state.necropsy.viewType

export const selectFilters = (state: RootState): NecropsyFilters => state.necropsy.filters

export const selectFilterDate = (state: RootState): DateFilter => state.necropsy.filterDate

export const selectAnimalFilters = (state: RootState): AnimalFilters => state.necropsy.animalFilters

export const selectSpeciesFilters = (state: RootState): SpeciesFilters => state.necropsy.speciesFilters

// Combined loading selector
export const selectIsLoading = (state: RootState): boolean =>
  state.necropsy.animalLoading || state.necropsy.speciesLoading

// Get current list based on view type
export const selectCurrentList = (state: RootState): AnimalNecropsyItem[] | SpeciesNecropsyItem[] =>
  state.necropsy.viewType === 'animals' ? state.necropsy.animalList : state.necropsy.speciesList

export const selectCurrentTotal = (state: RootState): number =>
  state.necropsy.viewType === 'animals' ? state.necropsy.animalTotal : state.necropsy.speciesTotal

export default necropsySlice.reducer
