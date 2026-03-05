import { useCallback, useEffect, useMemo, useRef, SyntheticEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { debounce, DebouncedFunc } from 'lodash'
import {
  fetchAnimalWiseList,
  fetchSpeciesWiseList,
  fetchNecropsyStats,
  setFilters,
  setActiveCard,
  setViewType,
  setFilterDate,
  setAnimalFilters,
  setSpeciesFilters,
  resetPage,
  clearLists,
  selectSelectedCenter,
  selectStats,
  selectStatsLoading,
  selectAnimalList,
  selectAnimalTotal,
  selectAnimalLoading,
  selectSpeciesList,
  selectSpeciesTotal,
  selectSpeciesLoading,
  selectActiveCard,
  selectViewType,
  selectFilters,
  selectFilterDate,
  selectAnimalFilters,
  selectSpeciesFilters,
  selectIsLoading
} from 'src/store/slices/necropsy/necropsySlice'
import type { AppDispatch } from 'src/store/store'
import type {
  NecropsyFilters,
  DateFilter,
  AnimalFilters,
  SpeciesFilters,
  ViewType,
  ActiveCard,
  IndexedAnimalRow,
  IndexedSpeciesRow,
  PaginationModel,
  UseNecropsyListReturn
} from 'src/types/necropsy'

/**
 * Custom hook for managing necropsy list data with Redux
 * Provides memoized data, optimized debounced search, and parallel API calls
 */
export const useNecropsyList = (): UseNecropsyListReturn => {
  const dispatch = useDispatch<AppDispatch>()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Selectors
  const selectedNecropsy = useSelector(selectSelectedCenter)
  const stats = useSelector(selectStats)
  const statsLoading = useSelector(selectStatsLoading)
  const animalList = useSelector(selectAnimalList)
  const animalTotal = useSelector(selectAnimalTotal)
  const animalLoading = useSelector(selectAnimalLoading)
  const speciesList = useSelector(selectSpeciesList)
  const speciesTotal = useSelector(selectSpeciesTotal)
  const speciesLoading = useSelector(selectSpeciesLoading)
  const activeCard = useSelector(selectActiveCard)
  const viewType = useSelector(selectViewType)
  const filters = useSelector(selectFilters)
  const filterDate = useSelector(selectFilterDate)
  const animalFilters = useSelector(selectAnimalFilters)
  const speciesFilters = useSelector(selectSpeciesFilters)
  const isLoading = useSelector(selectIsLoading)

  // Ref to store latest filters for debounce callback
  const filtersRef = useRef<NecropsyFilters>(filters)
  filtersRef.current = filters

  // Format date helper
  const formatDate = useCallback((dateValue: string | Date | null): string | null => {
    if (!dateValue) return null

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue)

    return date.toISOString().split('T')[0]
  }, [])

  // Prepare filter array helper
  const prepareFilterArray = useCallback(
    (filterObj: AnimalFilters | SpeciesFilters, key: string): string | undefined => {
      const value = (filterObj as unknown as Record<string, unknown>)[key]
      if (Array.isArray(value) && value.length > 0) {
        return JSON.stringify(value)
      }

      return undefined
    },
    []
  )

  // Build base payload
  const getBasePayload = useCallback(
    () => ({
      page_no: filters.page,
      limit: filters.limit,
      q: filters.q,
      from_date: formatDate(filterDate.startDate),
      status: activeCard,
      necropsy_center_id: selectedNecropsy?.id
    }),
    [filters, filterDate, activeCard, selectedNecropsy?.id, formatDate]
  )

  // Fetch necropsy data (list)
  const fetchNecropsyData = useCallback(async (): Promise<void> => {
    if (!selectedNecropsy?.id) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const basePayload = getBasePayload()

    if (viewType === 'animals') {
      dispatch(clearLists())
      dispatch(
        fetchAnimalWiseList({
          ...basePayload,
          to_date: formatDate(filterDate.endDate),
          use_case: 'necropsy_module',
          site_id: prepareFilterArray(animalFilters, 'Site'),
          priority: animalFilters['Priority'] || undefined,
          sex_type: prepareFilterArray(animalFilters, 'Sex'),
          necropsy_on_site:
            animalFilters['Necropsy Location']?.length === 1
              ? animalFilters['Necropsy Location'][0]
              : undefined,
          necropsy_conducted_by: prepareFilterArray(animalFilters, 'Necropsy Conducted By'),
          created_by: prepareFilterArray(animalFilters, 'Created By')
        })
      )
    } else {
      dispatch(clearLists())
      dispatch(
        fetchSpeciesWiseList({
          ...basePayload,
          til_date: formatDate(filterDate.endDate),
          site_id: speciesFilters['Site']?.[0] as number ?? undefined,
          priority: speciesFilters['Priority'] || undefined
        })
      )
    }
  }, [
    selectedNecropsy?.id,
    getBasePayload,
    viewType,
    filterDate,
    animalFilters,
    speciesFilters,
    formatDate,
    prepareFilterArray,
    dispatch
  ])

  // Fetch stats
  const fetchStats = useCallback(async (): Promise<void> => {
    if (!selectedNecropsy?.id) return

    dispatch(
      fetchNecropsyStats({
        necropsy_center_id: selectedNecropsy.id,
        from_date: formatDate(filterDate.startDate),
        til_date: formatDate(filterDate.endDate),
        type: viewType,
        use_case: 'necropsy_module'
      })
    )
  }, [selectedNecropsy?.id, filterDate, viewType, formatDate, dispatch])

  // Fetch both stats and data in parallel
  const fetchAll = useCallback((): void => {
    fetchStats()
    fetchNecropsyData()
  }, [fetchStats, fetchNecropsyData])

  // Debounced search with stable reference
  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(
          setFilters({
            ...filtersRef.current,
            q: value,
            page: 1
          })
        )
      }, 500),
    [dispatch]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [debouncedSearch])

  // Handle search
  const handleSearch = useCallback(
    (value: string): void => {
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  // Handle search clear
  const handleSearchClear = useCallback((): void => {
    debouncedSearch.cancel()
    dispatch(setFilters({ ...filters, q: '', page: 1 }))
  }, [dispatch, filters, debouncedSearch])

  // Handle pagination
  const handlePaginationChange = useCallback(
    (model: PaginationModel): void => {
      dispatch(
        setFilters({
          page: model.page + 1,
          limit: model.pageSize
        })
      )
    },
    [dispatch]
  )

  // Handle active card change
  const handleActiveCardChange = useCallback(
    (cardId: ActiveCard): void => {
      dispatch(setActiveCard(cardId))
      dispatch(resetPage())
    },
    [dispatch]
  )

  // Handle view type change
  const handleViewTypeChange = useCallback(
    (_event: SyntheticEvent, newValue: ViewType | null): void => {
      if (newValue !== null) {
        dispatch(setViewType(newValue))
        dispatch(resetPage())
      }
    },
    [dispatch]
  )

  // Handle date filter change
  const handleDateFilterChange = useCallback(
    (dateRange: DateFilter): void => {
      dispatch(setFilterDate(dateRange))
      dispatch(resetPage())
    },
    [dispatch]
  )

  // Handle animal filters apply
  const applyAnimalFilters = useCallback(
    (selectedOptions: AnimalFilters): void => {
      dispatch(setAnimalFilters(selectedOptions))
      dispatch(resetPage())
    },
    [dispatch]
  )

  // Handle species filters apply
  const applySpeciesFilters = useCallback(
    (selectedOptions: SpeciesFilters): void => {
      dispatch(setSpeciesFilters(selectedOptions))
      dispatch(resetPage())
    },
    [dispatch]
  )

  // Memoized indexed rows for animals
  const indexedAnimalRows: IndexedAnimalRow[] = useMemo(
    () =>
      animalList.map((row, index) => ({
        ...row,
        id: row.mortality_id,
        sl_no: (filters.page - 1) * filters.limit + index + 1,
        mortality_date: row.mortality_created_at
      })),
    [animalList, filters.page, filters.limit]
  )

  // Memoized indexed rows for species
  const indexedSpeciesRows: IndexedSpeciesRow[] = useMemo(
    () =>
      speciesList.map((row, index) => ({
        id: row.tsn || index,
        tsn: row.tsn,
        sl_no: (filters.page - 1) * filters.limit + index + 1,
        species_name: row.default_common_name || row.scientific_name || '',
        scientific_name: row.scientific_name,
        default_common_name: row.default_common_name,
        count: Number(row.count || 0),
        default_icon: row.default_icon
      })),
    [speciesList, filters.page, filters.limit]
  )

  // Get filter count (excluding Priority since it's shown separately)
  const animalFilterCount = useMemo(() => {
    return Object.entries(animalFilters).filter(
      ([key, arr]) => key !== 'Priority' && Array.isArray(arr) && arr.length > 0
    ).length
  }, [animalFilters])

  const speciesFilterCount = useMemo(() => {
    return Object.entries(speciesFilters).filter(
      ([key, arr]) => key !== 'Priority' && Array.isArray(arr) && arr.length > 0
    ).length
  }, [speciesFilters])

  return {
    // Data
    selectedNecropsy,
    stats,
    statsLoading,
    animalList,
    animalTotal,
    animalLoading,
    speciesList,
    speciesTotal,
    speciesLoading,
    isLoading,

    // Indexed rows (memoized)
    indexedAnimalRows,
    indexedSpeciesRows,

    // UI State
    activeCard,
    viewType,
    filters,
    filterDate,
    animalFilters,
    speciesFilters,
    animalFilterCount,
    speciesFilterCount,

    // Actions
    fetchAll,
    fetchStats,
    fetchNecropsyData,
    handleSearch,
    handleSearchClear,
    handlePaginationChange,
    handleActiveCardChange,
    handleViewTypeChange,
    handleDateFilterChange,
    applyAnimalFilters,
    applySpeciesFilters
  }
}

export default useNecropsyList
