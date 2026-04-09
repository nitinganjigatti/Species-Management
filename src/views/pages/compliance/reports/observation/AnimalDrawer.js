import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Checkbox,
  Drawer,
  Typography,
  IconButton,
  CircularProgress,
  Button,
  Skeleton,
  Tooltip
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import Search from 'src/views/utility/Search'
import { FilterButton } from 'src/views/utility/render-snippets'
import { Grid } from '@mui/system'
import { debounce } from 'lodash'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getAnimalFilterList, getAnimalListForObservationReport } from 'src/lib/api/compliance/reports'
import NoDataFound from 'src/views/utility/NoDataFound'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'

const PAGE_SIZE = 10

const AnimalDrawer = ({
  open,
  onClose,
  handleAnimalClick,
  btnText = 'GENERATE OBSERVATION REPORT',
  showAnimalFilter = true,
  showFilterAndSort = false,
  handleFilterClick = () => {},
  handleSortClick = () => {},
  module = 'housing',
  filters = {},
  sortType,
  filterCount,
  multiSelect = false,
  defaultSelected = [],
  customQueryParams = null,
  disabledIds = []
}) => {
  const theme = useTheme()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [internalSelected, setInternalSelected] = useState(null)
  const [internalMultiSelected, setInternalMultiSelected] = useState([])
  const [activeTab, setActiveTab] = useState('all_animals')
  const [horizontalLoading, setHorizontalLoading] = useState(true)
  const [horizontalNavList, setHorizontalNavList] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [isSelectAllUsed, setIsSelectAllUsed] = useState(false)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        clearAnimalQuery()
        setSearch(value)
      }, 500),
    []
  )

  useEffect(() => {
    const getAnimalsHorizontalNavigation = async () => {
      try {
        const params = {}
        const response = await getAnimalFilterList({ params })
        if (response?.success) {
          setHorizontalNavList(response?.data)
          setHorizontalLoading(false)
        }
      } catch (error) {
        console.log('Error getting horizontal navigation list')
        console.error(error)
      }
    }

    getAnimalsHorizontalNavigation()
  }, [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  function formatDate(date) {
    return date ? date.toISOString().split('T')[0] : undefined
  }

  const shouldFetchHospitalAnimals = module !== 'hospital' || (module === 'hospital' && search.trim().length > 0)

  const stableFilters = useMemo(() => JSON.stringify(filters), [filters])
  const stableSortType = useMemo(() => JSON.stringify(sortType), [sortType])

  const stableCustomQueryParams = useMemo(() => JSON.stringify(customQueryParams), [customQueryParams])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, remove } = useInfiniteQuery({
    queryKey: [
      'animal-List-Observation-Report',
      module,
      search,
      activeTab,
      stableFilters,
      stableSortType,
      stableCustomQueryParams
    ],
    enabled: open && isReady && shouldFetchHospitalAnimals,

    queryFn: async ({ pageParam = 1 }) => {
      // Hospital module requires search input before fetching
      if (module === 'hospital' && !search.trim()) {
        return { animals: [], nextPage: undefined, total_animal_count: 0 }
      }

      // Base params common to all modules
      const baseParams = {
        page_no: pageParam,
        limit: PAGE_SIZE,
        list_type: 'animals',
        type: 'single',
        // include_dead_animal: 0,
        ...(search.trim() && { filter_aid_local_identifier: search })
      }

      // Build module-specific params conditionally
      let moduleParams = {}

      if (customQueryParams) {
        // customQueryParams from parent overrides module-based params
        moduleParams =
          typeof customQueryParams === 'function'
            ? customQueryParams({ search, activeTab, pageParam, filters, sortType })
            : customQueryParams
      } else if (module === 'hospital') {
        moduleParams = {
          animal_list_type: 'all_animals',
          gender: filters?.Gender || [],
          tsn_id: filters?.Species || [],
          site_id: filters?.Site || [],
          section_id: filters?.Section || [],
          enclosure_id: filters?.Enclosure || [],
          sort: sortType?.sort,
          column: sortType?.column,
          ignore_permission: 1,
          include_dead_animal: 0
        }
      } else {
        // Default params for housing, medical, and other modules
        moduleParams = {
          animal_list_type: activeTab
          // gender: filters?.Gender || [],
          // tsn_id: filters?.Species || [],
          // site_id: filters?.Site || [],
          // section_id: filters?.Section || [],
          // enclosure_id: filters?.Enclosure || [],
          // sort: sortType?.sort || 'asc',
          // column: sortType?.column || 'animal_id',
          // ignore_permission: 0
        }
      }

      // Single API call for all modules
      const params = { ...baseParams, ...moduleParams }
      const res = await getNewAnimalListWithFilters(params)

      return {
        animals: res?.data || [],
        nextPage: res?.data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total_animal_count: res?.total_count || 0
      }

      // =====================================================================
      // OLD: Separate module branches (used before, now unified above)
      // =====================================================================

      // --- OLD housing module branch (used getAnimalListForObservationReport) ---
      // if (module === 'housing') {
      //   const params = {
      //     page_no: pageParam,
      //     limit: PAGE_SIZE,
      //     q: search,
      //     type: activeTab,
      //     end_date: formatDate(new Date())
      //   }
      //   const res = await getAnimalListForObservationReport(params)
      //   return {
      //     animals: res?.data?.animals || [],
      //     nextPage: res?.data?.animals?.length === PAGE_SIZE ? pageParam + 1 : undefined,
      //     total_animal_count: res?.data?.total_animal_count || 0
      //   }
      // }

      // --- OLD hospital module branch ---
      // if (module === 'hospital') {
      //   if (!search.trim()) {
      //     return { animals: [], nextPage: undefined, total_animal_count: 0 }
      //   }
      //   const params = {
      //     page_no: pageParam,
      //     filter_aid_local_identifier: search,
      //     limit: PAGE_SIZE,
      //     list_type: 'animals',
      //     type: 'single',
      //     animal_list_type: 'all_animals',
      //     gender: filters?.Gender || [],
      //     tsn_id: filters?.Species || [],
      //     site_id: filters?.Site || [],
      //     section_id: filters?.Section || [],
      //     enclosure_id: filters?.Enclosure || [],
      //     sort: sortType?.sort,
      //     column: sortType?.column,
      //     include_dead_animal: 0,
      //     ignore_permission: 1
      //   }
      //   const res = await getNewAnimalListWithFilters(params)
      //   return {
      //     animals: res?.data || [],
      //     nextPage: res?.data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
      //     total_animal_count: res?.total_count || 0
      //   }
      // }

      // --- OLD medical module branch ---
      // if (module === 'medical') {
      //   const params = {
      //     page_no: pageParam,
      //     ...(search.trim() && { filter_aid_local_identifier: search }),
      //     limit: PAGE_SIZE,
      //     list_type: 'animals',
      //     type: 'single',
      //     animal_list_type: activeTab,
      //     gender: filters?.Gender || [],
      //     tsn_id: filters?.Species || [],
      //     site_id: filters?.Site || [],
      //     section_id: filters?.Section || [],
      //     enclosure_id: filters?.Enclosure || [],
      //     sort: sortType?.sort || 'asc',
      //     column: sortType?.column || 'animal_id',
      //     include_dead_animal: 0,
      //     ignore_permission: 0
      //   }
      //   const res = await getNewAnimalListWithFilters(params)
      //   return {
      //     animals: res?.data || [],
      //     nextPage: res?.data?.length === PAGE_SIZE ? pageParam + 1 : undefined,
      //     total_animal_count: res?.total_count || 0
      //   }
      // }
    },
    getNextPageParam: lastPage => lastPage.nextPage,
    gcTime: 0,
    staleTime: 0,
    keepPreviousData: false
  })

  const clearAnimalQuery = () => {
    queryClient.removeQueries({
      queryKey: ['animal-List-Observation-Report'],
      exact: false
    })
  }

  useEffect(() => {
    if (open) {
      setIsReady(false)
      setLocalSearch('')
      setSearch('')
      setInternalSelected(null)
      setInternalMultiSelected(multiSelect && defaultSelected.length > 0 ? defaultSelected : [])
      setIsSelectAllUsed(false)
      clearAnimalQuery()

      // Allow state to settle before enabling the query
      const timer = setTimeout(() => setIsReady(true), 0)
      return () => clearTimeout(timer)
    } else {
      setIsReady(false)
      queryClient.cancelQueries(['animal-List-Observation-Report', search])
      clearAnimalQuery()
      cooldownRef.current = false
    }
  }, [open])

  const list = useMemo(
    () =>
      data?.pages?.flatMap(page =>
        page.animals.map(animal => ({
          animal_id: animal?.animal_id,
          default_common_name: animal?.default_common_name || animal?.common_name,
          scientific_name: animal?.complete_name || animal?.scientific_name,
          user_enclosure_name: animal?.user_enclosure_name,
          section_name: animal?.section_name,
          site_name: animal?.site_name,
          type: animal?.type,
          sex: animal?.sex,
          default_icon: animal?.default_icon,
          total_animal: animal?.total_animal,
          local_identifier_name: animal?.local_identifier_name,
          local_identifier_value: animal?.local_identifier_value,
          site_id: animal?.site_id,
          enclosure_id: animal?.enclosure_id,
          ...(module === 'hospital' && { in_transit: animal?.in_transit, is_hospitalized: animal?.is_hospitalized })
        }))
      ) || [],
    [data]
  )
  const total = useMemo(() => data?.pages?.[0]?.total_animal_count || 0, [data])

  const cooldownRef = useRef(false)

  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    clearAnimalQuery()
    setSearch('')
  }

  const handleTabClick = tabValue => {
    setActiveTab(tabValue)
  }

  const selectableList = useMemo(() => {
    return list.filter(
      animal =>
        !(module === 'hospital' && (animal?.in_transit === '1' || animal?.is_hospitalized === '1')) &&
        !disabledIds.includes(animal?.animal_id)
    )
  }, [list, module, disabledIds])

  const isAllSelected =
    selectableList.length > 0 &&
    selectableList.every(animal => internalMultiSelected.some(a => a.animal_id === animal.animal_id))

  const handleSelectAll = () => {
    if (isAllSelected) {
      setIsSelectAllUsed(false)
      setInternalMultiSelected(prev => prev.filter(a => !selectableList.some(s => s.animal_id === a.animal_id)))
    } else {
      setIsSelectAllUsed(true)
      setInternalMultiSelected(prev => {
        const existingIds = new Set(prev.map(a => a.animal_id))
        const newAnimals = selectableList.filter(a => !existingIds.has(a.animal_id))
        return [...prev, ...newAnimals]
      })
    }
  }

  const handleMultiSelectToggle = animal => {
    setIsSelectAllUsed(false)
    setInternalMultiSelected(prev => {
      const isSelected = prev.some(a => a.animal_id === animal.animal_id)
      if (isSelected) {
        return prev.filter(a => a.animal_id !== animal.animal_id)
      }
      return [...prev, animal]
    })
  }

  const onGenerateClick = () => {
    let result
    if (multiSelect) {
      result = handleAnimalClick(internalMultiSelected, { isSelectAll: isSelectAllUsed })
    } else {
      result = handleAnimalClick(internalSelected)
    }
    if (result !== false) {
      onClose()
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors.bodyBg
        }
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}>
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 500,
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Select the Animal
          </Typography>
          <IconButton
            onClick={() => {
              setInternalSelected(null)
              setInternalMultiSelected([])
              onClose()
            }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Grid
          container
          spacing={2}
          alignItems='center'
          sx={{
            px: 4,
            background: '#FFF',
            pt: 0,
            pb: 4
          }}
        >
          <Grid size={{ xs: 12, sm: showFilterAndSort ? 10 : 12 }}>
            <Search
              width='100%'
              placeholder='Search animal by AID or identifier'
              value={localSearch}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              inputStyle={{ py: '12px', px: '12px' }}
            />
          </Grid>
          {showFilterAndSort && (
            <>
              <Grid item size={{ xs: 1, sm: 1 }}>
                <FilterButton
                  bgColor={theme?.palette?.customColors?.OnPrimary}
                  border={`1px solid ${theme?.palette?.customColors?.OutlineVariant}`}
                  onClick={handleFilterClick}
                  appliedFiltersCount={filterCount}
                />
              </Grid>
              <Grid size={{ xs: 1, sm: 1 }}>
                <Tooltip title='Sort' placement='bottom'>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      bgcolor: theme?.palette.customColors?.OnPrimary,
                      border: `1px solid ${theme?.palette?.customColors?.OutlineVariant}`,
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={handleSortClick}
                  >
                    <Icon icon={'lets-icons:sort-arrow'} fontSize={24} />
                  </Box>
                </Tooltip>
              </Grid>
            </>
          )}
        </Grid>

        {showAnimalFilter && (
          <Box
            sx={{
              background: theme.palette.customColors.bodyBg,
              px: 4,
              pt: 3,
              pb: 3
            }}
          >
            {horizontalLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  pb: 1,
                  height: 48,
                  alignItems: 'center',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                  '-ms-overflow-style': 'none'
                }}
              >
                {Array.from(new Array(4)).map((_, idx) => (
                  <Skeleton key={idx} variant='rectangular' width={150} height={40} sx={{ borderRadius: 1 }} />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  },
                  '-ms-overflow-style': 'none',
                  pb: 1
                }}
              >
                {horizontalNavList.map((item, index) => (
                  <Button
                    key={index}
                    onClick={() => handleTabClick(item.type)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '2',
                      px: 3,
                      py: 1.5,
                      fontWeight: 500,
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      minWidth: 'auto',
                      flexShrink: 0,
                      border: 'none',
                      backgroundColor: activeTab === item.type ? '#1F515B' : '#0000000D',
                      color: activeTab === item.type ? '#FFFFFF' : '#666666',
                      '&:hover':
                        activeTab === item.type
                          ? {
                              backgroundColor: '#1F515B !important'
                            }
                          : {
                              backgroundColor: '#e0ecee'
                            }
                    }}
                  >
                    {item.label} {activeTab === item.type && total ? ` (${total})` : ''}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            bgcolor: theme.palette.customColors.bodyBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minHeight: 0,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            '-ms-overflow-style': 'none',
            py: showAnimalFilter ? 1 : 4
          }}
        >
          {isFetching && list.length === 0 ? (
            <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
              <CircularProgress />
            </Box>
          ) : (
            // : module === 'hospital' && search.trim().length === 0 && !isFetching ? (
            //   <Box
            //     sx={{
            //       backgroundColor: theme.palette.customColors.antzNotes,
            //       display: 'flex',
            //       alignItems: 'center',
            //       justifyContent: 'center',
            //       px: 4,
            //       py: 4,
            //       mt: 4,
            //       borderRadius: 1
            //     }}
            //   >
            //     <Typography
            //       sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
            //     >
            //       Search animal by AID or animal identifier
            //     </Typography>
            //   </Box>
            // )
            <>
              {multiSelect && selectableList.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 1,
                    py: 1,
                    cursor: 'pointer'
                  }}
                  onClick={handleSelectAll}
                >
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={internalMultiSelected.length > 0 && !isAllSelected}
                    onChange={handleSelectAll}
                    onClick={e => e.stopPropagation()}
                    sx={{
                      width: 24,
                      height: 24,
                      p: 0,
                      '& .MuiSvgIcon-root': { fontSize: 24 }
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: theme.palette.text.secondary
                    }}
                  >
                    Select All
                  </Typography>
                </Box>
              )}
              {list.map(animal => {
                const isDisabled =
                  (module === 'hospital' && (animal?.in_transit === '1' || animal?.is_hospitalized === '1')) ||
                  disabledIds.includes(animal?.animal_id)

                return (
                  <AnimalParentCard
                    key={animal.animal_id}
                    data={animal}
                    radio={
                      !multiSelect
                        ? isDisabled
                          ? false
                          : {
                              checked: internalSelected?.animal_id === animal.animal_id,
                              onChange: () => setInternalSelected(animal)
                            }
                        : false
                    }
                    checkbox={
                      multiSelect
                        ? isDisabled
                          ? false
                          : {
                              checked: internalMultiSelected.some(a => a.animal_id === animal.animal_id),
                              onChange: () => handleMultiSelectToggle(animal)
                            }
                        : false
                    }
                  />
                )
              })}
              {list.length === 0 && !isFetching && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 200,
                    flexDirection: 'column'
                  }}
                >
                  <NoDataFound variant='Meerkat' height={250} width={250} />
                </Box>
              )}
              {hasNextPage && (
                <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                  <CircularProgress />
                </Box>
              )}
              {!hasNextPage && list.length > 0 && (
                <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                  No more species to load
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      {(multiSelect ? internalMultiSelected.length > 0 : internalSelected !== null) && (
        <Box
          sx={{
            width: '100%',
            p: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Button
            variant='contained'
            fullWidth
            color='primary'
            onClick={onGenerateClick}
            sx={{ p: 3, fontWeight: 600 }}
          >
            {multiSelect && internalMultiSelected.length > 0
              ? `${btnText} (${isSelectAllUsed && total > 0 ? total : internalMultiSelected.length})`
              : btnText}
          </Button>
        </Box>
      )}
    </Drawer>
  )
}

export default AnimalDrawer
