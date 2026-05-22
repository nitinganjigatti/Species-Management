'use client'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { getAnimalJournalLogs } from 'src/lib/api/housing'
import Utility from 'src/utility'
import GroupedTimeline from 'src/views/pages/hospital/inpatient/GroupedTimeline'
import MedicalSummaryFilterDrawer from '../drawer/MedicalSummaryFilterDrawer'
import { useSelector } from 'react-redux'
import { GetAnimalJournalLogsParams, GetAnimalJournalLogsResponse } from 'src/types/housing/api/animal'
import { AnimalJournalLog } from 'src/types/housing/models'
import { FilterDate } from 'src/types/hospital/models'

const STORAGE_KEY = 'medical_record_data'

export interface MedicalSummaryFilters {
  page: number
  limit: number
  q: string
  module_filter: string
  user_ids: string | number[]
}

export interface MedicalSummaryFilterDate {
  startDate?: string
  endDate?: string
}

export interface MedicalSummarySelectedOptions {
  User: number[]
  'Medical Type'?: string[]
}

export interface JournalLogsPage {
  data: AnimalJournalLog[]
  result?: AnimalJournalLog[]
  total_count?: number
}

export interface FetchJournalLogsArgs {
  pageParam?: number
}

export interface AllMedicalEntries {
  data?: AnimalJournalLog[];
  result?: AnimalJournalLog[];
  total_count?: number;
}

const InpatientMedicalSummary = () => {
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}
  const animal_id = medicalRecordData?.animal_id

  const [filters, setFilters] = useState<MedicalSummaryFilters>({
    page: 1,
    limit: 10,
    q: '',
    module_filter: '',
    user_ids: []
  })
  const [searchValue, setSearchValue] = useState<string>('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [selectedOptions, setSelectedOptions] = useState<MedicalSummarySelectedOptions>({ User: [] })
  const [filterDate, setFilterDate] = useState<FilterDate>({})

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters((prev: MedicalSummaryFilters) => ({ ...prev, q: value }))
      }, 500),
    []
  )

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  //  Medical type dropdown change handler
  const handleMedicalTypeChange = (type: string) => {
    setFilters((prev: any) => ({ ...prev, module_filter: type }))
  }

  // Drawer Apply Filters
  const applyFilters = (selectedOptions: MedicalSummarySelectedOptions) => {
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

  const fetchAnimalJournalLogs = async ({ pageParam = 1 }: any) => {
    const params: GetAnimalJournalLogsParams = {
      ...filters,
      page: pageParam,
      animal_id
    }

    // Add date filters if selected
    if (filterDate?.startDate) {
      params.start_date = (Utility as any).formatDate(filterDate?.startDate, 'YYYY-MM-DD')
    }
    if (filterDate?.endDate) {
      params.end_date = (Utility as any).formatDate(filterDate?.endDate, 'YYYY-MM-DD')
    }

    const res = await getAnimalJournalLogs(params)

    return res?.data
  }

  const getNextPageParam = (lastPage: JournalLogsPage, pages: Array<JournalLogsPage>) => {
    const totalCount = Number(lastPage?.total_count) || 0
    const fetchedCount = pages.reduce((sum: number, p: JournalLogsPage) => sum + (p?.data?.length || 0), 0)

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
  } = useInfiniteQuery<GetAnimalJournalLogsResponse>({
    queryKey,
    queryFn: fetchAnimalJournalLogs,
    getNextPageParam,
    enabled: !!animal_id,
    initialPageParam: 1
  } as any)

  // Combine all pages of data
  const allMedicalEntries: AllMedicalEntries[] = useMemo(() => {
    return medicalSummaryData?.pages?.flatMap((page) => page?.data || []) || []
  }, [medicalSummaryData])

  const hasActiveFilters = useMemo(() => {
    const parsed = Array.isArray(filters.user_ids) ? filters.user_ids : JSON.parse(filters.user_ids)

    return Boolean(filters.q || filters.module_filter || filterDate?.startDate || filterDate?.endDate || parsed.length)
  }, [filters.q, filters.module_filter, filters.user_ids, filterDate.startDate, filterDate.endDate])

  const isInitialLoading = !medicalSummaryData?.pages?.length // initial load
  const isRefetching = isFetching && medicalSummaryData?.pages && medicalSummaryData?.pages?.length > 0 && !isFetchingNextPage //  fetch after initial load

  // Infinite scroll
  const observer = useRef<IntersectionObserver | undefined>(undefined)

  const lastTimelineRef = useCallback(
    (node: HTMLDivElement | null) => {
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
