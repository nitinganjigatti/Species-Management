import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'
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

/**
 * Custom hook for managing necropsy list data with Redux
 * Provides memoized data, optimized debounced search, and parallel API calls
 */
export const useNecropsyList = () => {
  const dispatch = useDispatch()
  const abortControllerRef = useRef(null)

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
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  // Format date helper
  const formatDate = useCallback(dateString => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }, [])

  // Prepare filter array helper
  const prepareFilterArray = useCallback((filterObj, key) => {
    return filterObj[key]?.length > 0 ? JSON.stringify(filterObj[key]) : undefined
  }, [])

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
  const fetchNecropsyData = useCallback(async () => {
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
          priority: prepareFilterArray(animalFilters, 'Priority'),
          sex_type: prepareFilterArray(animalFilters, 'Sex'),
          necropsy_on_site:
            animalFilters['Necropsy Location']?.length === 1 ? animalFilters['Necropsy Location'][0] : undefined,
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
          site_id: speciesFilters['Site']?.[0] ?? undefined,
          priority: speciesFilters['Priority']?.[0]?.toLowerCase() ?? undefined
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
  const fetchStats = useCallback(async () => {
    if (!selectedNecropsy?.id) return

    dispatch(
      fetchNecropsyStats({
        necropsy_center_id: selectedNecropsy.id,
        from_date: formatDate(filterDate.startDate),
        til_date: formatDate(filterDate.endDate),
        type: viewType
      })
    )
  }, [selectedNecropsy?.id, filterDate, viewType, formatDate, dispatch])

  // Fetch both stats and data in parallel
  const fetchAll = useCallback(() => {
    fetchStats()
    fetchNecropsyData()
  }, [fetchStats, fetchNecropsyData])

  // Debounced search with stable reference
  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
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
    value => {
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    debouncedSearch.cancel()
    dispatch(setFilters({ ...filters, q: '', page: 1 }))
  }, [dispatch, filters, debouncedSearch])

  // Handle pagination
  const handlePaginationChange = useCallback(
    model => {
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
    cardId => {
      dispatch(setActiveCard(cardId))
      dispatch(resetPage())
    },
    [dispatch]
  )

  // Handle view type change
  const handleViewTypeChange = useCallback(
    (event, newValue) => {
      if (newValue !== null) {
        dispatch(setViewType(newValue))
        dispatch(resetPage())
      }
    },
    [dispatch]
  )

  // Handle date filter change
  const handleDateFilterChange = useCallback(
    dateRange => {
      dispatch(setFilterDate(dateRange))
      dispatch(resetPage())
    },
    [dispatch]
  )

  // Handle animal filters apply
  const applyAnimalFilters = useCallback(
    selectedOptions => {
      dispatch(setAnimalFilters(selectedOptions))
      dispatch(resetPage())
    },
    [dispatch]
  )

  // Handle species filters apply
  const applySpeciesFilters = useCallback(
    selectedOptions => {
      dispatch(setSpeciesFilters(selectedOptions))
      dispatch(resetPage())
    },
    [dispatch]
  )

  // Memoized indexed rows for animals
  const indexedAnimalRows = useMemo(
    () =>
      animalList.map((row, index) => ({
        ...row,
        id: row.mortality_id,
        sl_no: (filters.page - 1) * filters.limit + index + 1
      })),
    [animalList, filters.page, filters.limit]
  )

  // Memoized indexed rows for species
  const indexedSpeciesRows = useMemo(
    () =>
      speciesList.map((row, index) => ({
        id: row.tsn || index,
        tsn: row.tsn,
        sl_no: (filters.page - 1) * filters.limit + index + 1,
        species_name: row.default_common_name || row.scientific_name,
        scientific_name: row.scientific_name,
        default_common_name: row.default_common_name,
        count: Number(row.count || 0),
        default_icon: row.default_icon
      })),
    [speciesList, filters.page, filters.limit]
  )

  // Get filter count
  const animalFilterCount = useMemo(() => {
    return Object.values(animalFilters).filter(arr => arr?.length > 0).length
  }, [animalFilters])

  const speciesFilterCount = useMemo(() => {
    return Object.values(speciesFilters).filter(arr => arr?.length > 0).length
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
