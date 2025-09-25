import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import GroupedTimeline from 'src/views/pages/hospital/inpatient/GroupedTimeline'
import { getAnimalJournalLogs } from 'src/lib/api/housing'
import { useQuery } from '@tanstack/react-query'

const InpatientMedicalSummary = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    q: '',
    module_filter: ''
  })
  const [searchValue, setSearchValue] = useState('')

  const router = useRouter()
  const { animal_id, id } = router.query

  useEffect(() => {
    const { page = '1', limit = '50', q = '', module_filter = '' } = router.query

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

  //  Fetch medical summary data
  const { data: medicalSummaryData, isFetching } = useQuery({
    queryKey: ['animalMedicalSummary', animal_id, filters],
    queryFn: () => getAnimalJournalLogs({ ...filters, animal_id }),
    select: res => res?.data?.data || [],
    enabled: !!animal_id,
    refetchOnWindowFocus: false, //Avoid unnecessary refetching when switching tabs
    onError: error => {
      Toaster({ type: 'error', message: error?.message || 'Failed to fetch data' })
    }
  })

  return (
    <GroupedTimeline
      medicalSummaryData={medicalSummaryData}
      isLoading={isFetching}
      searchQuery={searchValue}
      onSearchChange={handleSearchChange}
      medicalType={filters.module_filter}
      onMedicalTypeChange={handleMedicalTypeChange}
      onClearSearch={handleClearFilters}
    />
  )
}

export default InpatientMedicalSummary
