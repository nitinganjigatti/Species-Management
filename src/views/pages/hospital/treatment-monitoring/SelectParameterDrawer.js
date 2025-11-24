import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  IconButton,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { debounce } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import Icon from 'src/@core/components/icon'
import { getHospitalParamsFilterOptions, getParametersBasedOnFilters } from 'src/lib/api/hospital/treatmentMonitoring'
import NoDataFound from 'src/views/utility/NoDataFound'
import Search from 'src/views/utility/Search'

const PAGE_SIZE = 10

const SelectParameterDrawer = ({ open, setOpen, selectedAssessments, setSelectedAssessments, onAddSelected }) => {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const cooldownRef = useRef(false)

  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [paramsFilters, setParamsFilters] = useState([])
  const [activeTab, setActiveTab] = useState('')

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  const { data: filterData, isLoading: filterLoading } = useQuery({
    queryKey: ['hospital-parameters-filter'],
    queryFn: () => getHospitalParamsFilterOptions({ ref_type: 'animal' })
  })

  useEffect(() => {
    if (filterData?.success === true) {
      const backendFilters = filterData?.data?.map(item => ({
        label: item?.label,
        value: item?.assessment_category_id,
        count: item?.assessment_type_count
      }))

      const filters = [
        { label: 'All', value: '', count: backendFilters.reduce((acc, f) => acc + f.count, 0) },
        ...backendFilters
      ]
      setParamsFilters(filters)
      setActiveTab('')
    }
  }, [filterData])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, remove } = useInfiniteQuery({
    queryKey: ['get-parameters-based-on-filters', search, activeTab],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search,
        ref_type: 'animal',
        cat_id: activeTab
      }
      const res = await getParametersBasedOnFilters(params)

      return {
        parameters: res?.data?.result || [],
        nextPage: res?.data?.result?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total_count: res?.data?.total_count || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage
  })

  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries(['get-parameters-based-on-filters', search])
      remove()
      cooldownRef.current = false
    }
  }, [open, search, queryClient, remove])

  const list = useMemo(() => data?.pages?.flatMap(page => page.parameters) || [], [data])
  const total = useMemo(() => data?.pages?.[0]?.total_count || 0, [data])

  console.log(total)

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

  const handleTabClick = tabValue => {
    setActiveTab(tabValue)
  }

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleDrawerClose = () => {
    setOpen(false)
    setSelectedAssessments([])
  }

  const handleAdd = () => {
    if (onAddSelected) {
      onAddSelected(selectedAssessments)
    }
    handleDrawerClose()
  }

  return (
    <>
      <Drawer
        anchor='right'
        sx={{
          '& .MuiDrawer-paper': {
            width: ['100%', '562px'],
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
        open={open}
        onClose={handleDrawerClose}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors.OnPrimary,
              px: '1.2rem',
              py: '1rem',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
              <img src='/icons/Activity.svg' alt='Cluster Icon' width='32px' />
              <Typography
                sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                Select Parameters
              </Typography>
            </Box>

            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleDrawerClose}>
              <Icon icon='mdi:close' fontSize={30} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ px: 6, pt: 6, pb: 3 }}>
              <Search
                placeholder='Search Symptoms'
                value={localSearch}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
                inputStyle={{ py: '12px', px: '12px' }}
                width={'100%'}
              />
            </Box>
            <Box sx={{ py: 3, px: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {filterLoading ? (
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
                  {paramsFilters.map((item, index) => {
                    const isActive = activeTab === item.value
                    const showCount = item.value === '' ? total : item.count

                    return (
                      <Button
                        key={index}
                        onClick={() => handleTabClick(item.value)}
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
                          backgroundColor: isActive
                            ? theme.palette.customColors.OnPrimaryContainer
                            : theme.palette.customColors.mdAntzNeutral,
                          color: isActive
                            ? theme.palette.customColors.OnPrimary
                            : theme.palette.customColors.OnPrimaryContainer,
                          '&:hover': isActive
                            ? {
                                backgroundColor: `${theme.palette.customColors.OnPrimaryContainer} !important`
                              }
                            : {
                                backgroundColor: theme.palette.customColors.OutlineVariant
                              }
                        }}
                      >
                        {item.label} ({showCount})
                      </Button>
                    )
                  })}
                </Box>
              )}
              {isFetching && list.length === 0 ? (
                <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {list.map(assessment => {
                    const isSelected = selectedAssessments.some(item => item.id === assessment.assessment_type_id)

                    return (
                      <Box
                        key={assessment?.assessment_type_id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 4,
                          border: isSelected
                            ? `0.5px solid ${theme.palette.primary.main}`
                            : `1px solid ${theme.palette.customColors.SurfaceVariant}`,
                          backgroundColor: isSelected
                            ? theme.palette.customColors.Surface
                            : theme.palette.customColors.OnPrimary,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'background 0.2s, border-color 0.2s'
                        }}
                        onClick={() => {
                          setSelectedAssessments(prev => {
                            const isSelected = prev.some(item => item.id === String(assessment.assessment_type_id))

                            if (isSelected) {
                              return prev.filter(item => item.id !== String(assessment.assessment_type_id))
                            } else {
                              return [
                                ...prev,
                                {
                                  id: String(assessment.assessment_type_id),
                                  label: assessment.assessments_type_label
                                }
                              ]
                            }
                          })
                        }}
                      >
                        <Typography
                          sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                        >
                          {assessment?.assessments_type_label}
                        </Typography>
                        <Checkbox checked={isSelected} />
                      </Box>
                    )
                  })}
                  {list.length === 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 200,
                        flexDirection: 'column',
                        p: 4,
                        mt: 6
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
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurface }}>
              Selected - {selectedAssessments.length}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '50%' }}>
              <Button
                variant='outlined'
                fullWidth
                onClick={handleDrawerClose}
                sx={{
                  borderColor: theme.palette.customColors.OnPrimaryContainer,
                  color: theme.palette.customColors.OnPrimaryContainer,
                  height: '56px'
                }}
              >
                Cancel
              </Button>
              <Button variant='contained' fullWidth onClick={handleAdd} sx={{ height: '56px' }}>
                Add
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SelectParameterDrawer
