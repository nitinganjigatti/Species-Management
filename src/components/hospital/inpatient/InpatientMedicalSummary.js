import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { getAnimalJournalLogs } from 'src/lib/api/housing'
import Utility from 'src/utility'
import GroupedTimeline from 'src/views/pages/hospital/inpatient/GroupedTimeline'
import MedicalSummaryFilterDrawer from '../drawer/MedicalSummaryFilterDrawer'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'

const STORAGE_KEY = 'medical_record_data'

const InpatientMedicalSummary = () => {
  const { data } = useDynamicStateContext()
  const medicalRecordData = data[STORAGE_KEY] || {}
  const animal_id = medicalRecordData?.animal_id

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    q: '',
    module_filter: '',
    user_ids: []
  })
  const [searchValue, setSearchValue] = useState('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({ User: [] })
  const [filterDate, setFilterDate] = useState({})

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        setFilters(prev => ({ ...prev, q: value }))
      }, 500),
    []
  )

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleSearchChange = value => {
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  //  Medical type dropdown change handler
  const handleMedicalTypeChange = type => {
    setFilters(prev => ({ ...prev, module_filter: type }))
  }

  // Drawer Apply Filters
  const applyFilters = selectedOptions => {
    const userIds = selectedOptions?.User || []
    const medicalType = selectedOptions?.['Medical Type']?.[0] || ''

    const updatedFilters = {
      ...filters,
      user_ids: JSON.stringify(userIds),
      module_filter: medicalType
    }
    setFilters(updatedFilters)
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  const fetchAnimalJournalLogs = async ({ pageParam = 1 }) => {
    const params = {
      ...filters,
      page: pageParam,
      animal_id
    }

    // Add date filters if selected
    if (filterDate?.startDate) {
      params.start_date = Utility.formatDate(filterDate?.startDate, 'YYYY-MM-DD')
    }
    if (filterDate?.endDate) {
      params.end_date = Utility.formatDate(filterDate?.endDate, 'YYYY-MM-DD')
    }

    const res = await getAnimalJournalLogs(params)

    return res?.data
  }

  const getNextPageParam = (lastPage, pages) => {
    const totalCount = Number(lastPage?.total_count) || 0
    const fetchedCount = pages.reduce((sum, p) => sum + (p?.data?.length || 0), 0)

    return fetchedCount < totalCount ? pages.length + 1 : undefined
  }

  const queryKey = useMemo(
    () => [
      'animalMedicalSummary',
      animal_id,
      filters.q,
      filters.module_filter,
      filters.user_ids,
      filterDate.startDate,
      filterDate.endDate
    ],
    [animal_id, filters, filterDate]
  )

  const {
    data: medicalSummaryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchAnimalJournalLogs,
    getNextPageParam,
    enabled: !!animal_id
  })

  // Combine all pages of data
  const allMedicalEntries = useMemo(() => {
    return medicalSummaryData?.pages?.flatMap(page => page?.data || []) || []
  }, [medicalSummaryData])

  const hasActiveFilters = useMemo(() => {
    const parsed = Array.isArray(filters.user_ids) ? filters.user_ids : JSON.parse(filters.user_ids)

    return Boolean(
      searchValue || filters.module_filter || filterDate?.startDate || filterDate?.endDate || parsed.length
    )
  }, [searchValue, filters.module_filter, filters.user_ids, filterDate.startDate, filterDate.endDate])

  const isInitialLoading = !medicalSummaryData?.pages?.length // initial load
  const hasInitialData = medicalSummaryData?.pages?.length > 0
  const isRefetching = isFetching && hasInitialData && !isFetchingNextPage //  fetch after initial load

  // Infinite scroll
  const observer = useRef()

  const lastTimelineRef = useCallback(
    node => {
      if (isFetchingNextPage || !hasNextPage) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })

      if (node) observer.current.observe(node)
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  )

  return (
    <>
      <GroupedTimeline
        medicalSummaryData={allMedicalEntries}
        isLoading={isInitialLoading}
        isRefetching={isRefetching}
        searchQuery={searchValue}
        onSearchChange={handleSearchChange}
        medicalType={filters.module_filter}
        onMedicalTypeChange={handleMedicalTypeChange}
        onClearSearch={handleClearSearch}
        lastTimelineRef={lastTimelineRef}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        setOpenFilterDrawer={setOpenFilterDrawer}
        filterCount={filterCount}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        hasActiveFilters={hasActiveFilters}
      />

      {openFilterDrawer && (
        <MedicalSummaryFilterDrawer
          open={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          onApplyFilters={applyFilters}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions}
        />
      )}
    </>
  )
}

export default InpatientMedicalSummary
