import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import GroupedTimeline from 'src/views/pages/hospital/inpatient/GroupedTimeline'
import { getAnimalJournalLogs } from 'src/lib/api/housing'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'

const InpatientMedicalSummary = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    q: '',
    module_filter: ''
  })
  const [searchValue, setSearchValue] = useState('')

  const router = useRouter()
  const { animal_id, id } = router.query

  // Update filters when query changes
  useEffect(() => {
    const { page = '1', limit = '10', q = '', module_filter = '' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q: q,
      module_filter: module_filter
    })
    setSearchValue(q)
  }, [router.query])

  // Update URL based on filter and search changes
  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== '') {
        params.set(key, value.toString())
      }
    })
    router.push(
      { pathname: router.pathname, query: { id, animal_id, ...Object.fromEntries(params.entries()) } },
      undefined,
      {
        shallow: true
      }
    )
  }

  // search handler
  const searchMedicalSummaryData = useMemo(
    () =>
      debounce((value, currentFilters) => {
        const updated = { ...currentFilters, q: value, page: 1 }

        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    []
  )

  // On search input change handler
  const handleSearchChange = value => {
    setSearchValue(value)
    searchMedicalSummaryData(value, filters)
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      searchMedicalSummaryData.cancel() // cancel pending debounce when component unmounts
    }
  }, [searchMedicalSummaryData])

  //  Medical type dropdown change handler
  const handleMedicalTypeChange = type => {
    const updated = { ...filters, module_filter: type, page: 1 }

    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleClearFilters = () => {
    const resetFilters = { ...filters, q: '', page: 1 }

    setFilters(resetFilters)
    setSearchValue('')
    updateUrlParams(resetFilters)
  }

  // Fetch function
  const fetchAnimalJournalLogs = async ({ pageParam = 1, filters, animal_id }) => {
    const res = await getAnimalJournalLogs({
      ...filters,
      page: pageParam,
      animal_id
    })

    return res?.data
  }

  // Pagination function
  const getNextPage = (lastPage, pages) => {
    const totalCount = Number(lastPage?.total_count) || 0
    const fetchedCount = pages.reduce((sum, p) => sum + (p?.data?.length || 0), 0)

    return fetchedCount < totalCount ? pages.length + 1 : undefined
  }

  //  Fetch medical summary data
  const {
    data: medicalSummaryData = [],
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['animalMedicalSummary', animal_id, filters],
    queryFn: ({ pageParam = 1 }) => fetchAnimalJournalLogs({ pageParam, filters, animal_id }),
    getNextPageParam: getNextPage,
    enabled: !!animal_id,
    refetchOnWindowFocus: false, //Avoid unnecessary refetching when switching tabs
    onError: error => {
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch data' })
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
    <GroupedTimeline
      medicalSummaryData={allMedicalEntries}
      isLoading={isFetching && allMedicalEntries.length === 0}
      searchQuery={searchValue}
      onSearchChange={handleSearchChange}
      medicalType={filters.module_filter}
      onMedicalTypeChange={handleMedicalTypeChange}
      onClearSearch={handleClearFilters}
      lastTimelineRef={lastTimelineRef}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  )
}

export default InpatientMedicalSummary
