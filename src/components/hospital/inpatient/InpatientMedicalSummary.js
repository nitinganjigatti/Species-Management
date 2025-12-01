import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { getAnimalJournalLogs } from 'src/lib/api/housing'
import Utility from 'src/utility'
import Toaster from 'src/components/Toaster'
import GroupedTimeline from 'src/views/pages/hospital/inpatient/GroupedTimeline'
import MedicalSummaryFilterDrawer from '../drawer/MedicalSummaryFilterDrawer'

const InpatientMedicalSummary = ({ patientData }) => {
  const router = useRouter()
  const animalId = patientData?.animal_detail?.animal_id

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

  // Update URL based on filter and search changes
  const updateUrlParams = useCallback(
    updatedFilters => {
      const params = new URLSearchParams()
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          params.set(key, value.toString())
        }
      })

      // Keep only non-filter params
      const nonFilterParams = Object.fromEntries(
        Object.entries(router.query).filter(([key]) => !['page', 'limit', 'q'].includes(key))
      )

      router.push(
        { pathname: router.pathname, query: { ...nonFilterParams, ...Object.fromEntries(params.entries()) } },
        undefined,
        {
          shallow: true
        }
      )
    },
    [router]
  )

  // Sync router params on load and change
  useEffect(() => {
    if (!router.isReady) return //prevents the code from running too early

    const { page = '1', limit = '10', q = '' } = router.query

    // Only update if something actually changed
    setFilters(prev => {
      const newFilters = {
        page: parseInt(page),
        limit: parseInt(limit),
        q
      }

      const isSame = prev.page === newFilters.page && prev.limit === newFilters.limit && prev.q === newFilters.q

      if (isSame) return prev // Prevent duplicate render and API re-fetch

      return newFilters
    })

    setSearchValue(q)
  }, [router.isReady, router.query])

  // search handler
  const searchMedicalSummaryData = useMemo(
    () =>
      debounce(value => {
        setFilters(prev => {
          const updated = { ...prev, q: value, page: 1 }
          updateUrlParams(updated)

          return updated
        })
      }, 500),
    [updateUrlParams]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      searchMedicalSummaryData.cancel() // cancel pending debounce when component unmounts
    }
  }, [searchMedicalSummaryData])

  // Search handler
  const handleSearchChange = useCallback(
    value => {
      setSearchValue(value)
      searchMedicalSummaryData(value)
    },
    [searchMedicalSummaryData]
  )

  const handleClearSearch = () => {
    setSearchValue('')
    searchMedicalSummaryData('')
  }

  //  Medical type dropdown change handler
  const handleMedicalTypeChange = useCallback(
    type => {
      const updated = { ...filters, module_filter: type, page: 1 }
      setFilters(updated)
    },
    [filters]
  )

  // Drawer Apply Filters
  const applyFilters = selectedOptions => {
    const userIds = selectedOptions?.User ? selectedOptions?.User : []
    const medicalType = selectedOptions?.['Medical Type']?.[0] || ''

    const updatedFilters = {
      ...filters,
      user_ids: JSON.stringify(userIds),
      module_filter: medicalType,
      page: 1
    }
    setSelectedOptions(selectedOptions)
    setFilters(updatedFilters)
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    if (!filterDate.startDate && !filterDate.endDate) return

    setFilters(prev => ({
      ...prev,
      page: 1
    }))
  }, [filterDate])

  const fetchAnimalJournalLogs = async ({ pageParam = 1, filters, filterDate }) => {
    const params = {
      ...filters,
      page: pageParam,
      animal_id: animalId
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

  // Pagination function
  const getNextPage = (lastPage, pages) => {
    const totalCount = Number(lastPage?.total_count) || 0
    const fetchedCount = pages.reduce((sum, p) => sum + (p?.data?.length || 0), 0)

    return fetchedCount < totalCount ? pages.length + 1 : undefined
  }

  //  Fetch medical summary data
  const queryKey = useMemo(
    () => ['animalMedicalSummary', animalId, filters, filterDate?.startDate, filterDate?.endDate],
    [animalId, filters, filterDate]
  )

  const {
    data: medicalSummaryData = [],
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetchAnimalJournalLogs({ pageParam, filters, filterDate }),
    getNextPageParam: getNextPage,
    enabled: !!animalId,
    onError: error => {
      console.error('Error fetching medical summary list:', error?.message || error)
      Toaster({ type: 'error', message: error?.response?.data?.message || error?.message || 'Failed to fetch data' })
    }
  })

  // Combine all pages of data
  const allMedicalEntries = useMemo(() => {
    return medicalSummaryData?.pages?.flatMap(page => page?.data || []) || []
  }, [medicalSummaryData])

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
        isLoading={isFetching && allMedicalEntries.length === 0}
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
