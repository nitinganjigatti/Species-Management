import React, { useEffect, useMemo, useState } from 'react'
import { Box, Checkbox, CircularProgress, FormControlLabel, Typography } from '@mui/material'
import { debounce } from 'lodash'
import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Search from 'src/views/utility/Search'
import { getHospitalTransferHospitalList } from 'src/lib/api/housing/common'
import { HospitalEntityItem } from 'src/types/housing/api/common'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10

type FilterMenuType = 'Timeline' | 'Hospital'

const FILTER_MENUS: FilterMenuType[] = ['Timeline', 'Hospital']

interface HospitalPage {
  list: HospitalEntityItem[]
  nextPage: number | undefined
}

export interface TransferFilters {
  startDate?: Date
  endDate?: Date
  hospitalIds: (string | number)[]
}

interface TransferFilterDrawerProps {
  open: boolean
  onClose: () => void
  onApplyFilters: (filters: TransferFilters) => void
  initialFilters?: Partial<TransferFilters>
}

const DEFAULT_FILTERS: TransferFilters = { hospitalIds: [] }

const TransferFilterDrawer: React.FC<TransferFilterDrawerProps> = ({
  open,
  onClose,
  onApplyFilters,
  initialFilters
}) => {
  const [selectedMenu, setSelectedMenu] = useState<FilterMenuType>('Timeline')
  const [filterDate, setFilterDate] = useState<{ startDate?: Date; endDate?: Date }>({})
  const [selectedHospitals, setSelectedHospitals] = useState<(string | number)[]>([])
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { t } = useTranslation()

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const isHospitalTabActive = open && selectedMenu === 'Hospital'

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery<
    HospitalPage,
    Error,
    InfiniteData<HospitalPage>,
    [string, string],
    number
  >({
    queryKey: ['hospital-transfer-filter-hospitals', debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const res = await getHospitalTransferHospitalList({
        limit: PAGE_SIZE,
        page_no: pageParam,
        ...(debouncedSearch.trim() && { q: debouncedSearch })
      })
      const list = res?.data?.list || []

      return {
        list,
        nextPage: list.length === PAGE_SIZE ? pageParam + 1 : undefined
      }
    },
    getNextPageParam: (lastPage: HospitalPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: isHospitalTabActive,
    refetchOnWindowFocus: false
  })

  const hospitals = useMemo(
    () => data?.pages.flatMap((page: HospitalPage) => page.list) || [],
    [data]
  )

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView])

  // Debounce search → update debouncedSearch which drives the query key
  const debouncedSetSearch = useMemo(() => debounce(setDebouncedSearch, 500), [])

  useEffect(() => {
    return () => debouncedSetSearch.cancel()
  }, [debouncedSetSearch])

  const handleHospitalSearch = (query: string) => {
    setHospitalSearch(query)
    debouncedSetSearch(query)
  }

  // Reset search when switching to Hospital tab or closing/reopening
  useEffect(() => {
    if (open && selectedMenu === 'Hospital') {
      setHospitalSearch('')
      setDebouncedSearch('')
    }
  }, [open, selectedMenu])

  useEffect(() => {
    if (open) {
      const f = initialFilters || DEFAULT_FILTERS
      setFilterDate(f.startDate ? { startDate: f.startDate, endDate: f.endDate } : {})
      setSelectedHospitals(f.hospitalIds || [])
      setSelectedMenu('Timeline')
    }
  }, [open])

  const selectedOptions = {
    Timeline: filterDate.startDate ? ['date'] : [],
    Hospital: selectedHospitals
  }

  const handleHospitalToggle = (value: string | number) => {
    setSelectedHospitals(prev => {
      const stringValue = String(value)
      const isSelected = prev.some(v => String(v) === stringValue)

      return isSelected ? prev.filter(v => String(v) !== stringValue) : [...prev, value]
    })
  }

  const handleApply = () => {
    onApplyFilters({
      startDate: filterDate.startDate,
      endDate: filterDate.endDate,
      hospitalIds: selectedHospitals
    })
    onClose()
  }

  const handleClearAll = () => {
    setFilterDate({})
    setSelectedHospitals([])
  }

  const filterLabels = {
    Timeline: t('housing_module.timeline'),
    Hospital: t('navigation.hospital')
  }

  return (
    <CustomFilterDrawer
      open={open}
      onClose={onClose}
      title='Filter'
      onApply={handleApply}
      onClearAll={handleClearAll}
      filterLists={FILTER_MENUS}
      filterLabels={filterLabels}
      selectedOptions={selectedOptions}
      selectedItem={selectedMenu}
      onSelectItem={(menu: string) => setSelectedMenu(menu as FilterMenuType)}
    >
      {selectedMenu === 'Timeline' ? (
        <CommonDateRangePickers
          filterDates={filterDate}
          onChange={(start: Date, end: Date) => setFilterDate({ startDate: start, endDate: end })}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ mb: 3 }}>
            <Search
              value={hospitalSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleHospitalSearch(e.target.value)
              }
              placeholder='Search hospital...'
              onClear={() => handleHospitalSearch('')}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {isFetching && hospitals.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : hospitals.length === 0 ? (
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                No data found
              </Typography>
            ) : (
              <>
                {hospitals.map(item => {
                  const isSelected = selectedHospitals.some(v => String(v) === String(item.id))

                  return (
                    <FormControlLabel
                      key={item.id}
                      control={
                        <Checkbox checked={isSelected} onChange={() => handleHospitalToggle(item.id)} />
                      }
                      label={
                        <TextEllipsisWithModal
                          enableDialog={false}
                          text={item.name}
                          style={{ fontSize: '1rem', maxWidth: '230px' }}
                        />
                      }
                      sx={{ mb: 2, display: 'flex' }}
                    />
                  )
                })}

                {hasNextPage && (
                  <Box ref={loaderRef} display='flex' justifyContent='center' p={2}>
                    <CircularProgress size={20} />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      )}
    </CustomFilterDrawer>
  )
}

export default TransferFilterDrawer
