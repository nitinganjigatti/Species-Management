'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react'
import { Box, Typography, Menu, MenuItem, CircularProgress, useTheme, Tooltip, Avatar } from '@mui/material'
import { KeyboardArrowDown } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useHospital } from 'src/context/HospitalContext'
import { getHospitalBedStats, getHospitalDetail, getHospitalListing } from 'src/lib/api/hospital/hospitalAnalytics'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import Search from 'src/views/utility/Search'
import debounce from 'lodash/debounce'
import { read } from 'src/lib/windows/utils'
import { AuthContext } from 'src/context/AuthContext'

interface HospitalDropdownProps {
  disabled?: boolean
}

const HospitalDropdown = ({ disabled = false }: HospitalDropdownProps) => {
  const theme: any = useTheme()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const {
    selectedHospital,
    hospitals,
    updateSelectedHospital,
    updateHospitals,
    hospitalStats,
    updateHospitalStats,
    setHospitalStatsLoading,
    hasFetchedStatsForCurrentHospital,
    markStatsAsFetched,
    setIsHospitalAccessChecked,
    hasNoHospitalsOnInitialFetch,
    hasCompletedInitialFetch,
    markInitialFetchComplete
  }: any = useHospital()

  const [anchorEl, setAnchorEl] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [isCheckingHospitalAccess, setIsCheckingHospitalAccess] = useState<boolean>(false)
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState<boolean>(false)
  const [shouldRefetchHospitals, setShouldRefetchHospitals] = useState<boolean>(false)
  const searchInputRef = useRef<any>(null)

  const authData: any = useContext(AuthContext)

  const PAGE_SIZE = 10

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const cooldownRef = useRef<boolean>(false)

  const shouldFetchInitial = useMemo(() => !disabled && !selectedHospital, [disabled, selectedHospital])

  const fetchHospitalDetail = async (id: any) => {
    try {
      const response: any = await (getHospitalDetail as any)(id)

      return response
    } catch (error) {
      console.error('Error fetching hospital detail:', error)

      return null
    }
  }

  const fetchAndUpdateHospitalStats = async (hospitalId: any) => {
    if (!hospitalId) return

    try {
      setHospitalStatsLoading(true)
      const statsResponse: any = await (getHospitalBedStats as any)(hospitalId)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
        markStatsAsFetched()
      }
    } catch (error) {
      console.error('Error fetching hospital stats:', error)
    } finally {
      setHospitalStatsLoading(false)
    }
  }

  const debouncedSearch = useRef(
    debounce((searchValue: string) => {
      setSearchQuery(searchValue)
    }, 500)
  ).current

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch: refetchHospitals
  } = useInfiniteQuery<any>({
    queryKey: ['hospitals-listing-inpatient', searchQuery],
    queryFn: async ({ pageParam = 1 }: any) => {
      const params = {
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: searchQuery?.trim(),
        has_permission: 1
      }
      const userId = authData?.userData?.user?.user_id || ''
      const response: any = await getHospitalListing(params, userId)

      if (response?.status) {
        const newHospitals = response.data.list || []
        const totalPages = Math.ceil(response.data.total_records / PAGE_SIZE) || 1

        if (pageParam === 1 && !hasCompletedInitialFetch && !searchQuery?.trim()) {
          markInitialFetchComplete(newHospitals.length)
        }

        return {
          result: newHospitals,
          nextPage: pageParam < totalPages ? pageParam + 1 : undefined,
          total: response.data.total_records || newHospitals.length
        }
      } else {
        throw new Error(response?.message || 'Failed to fetch hospitals')
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    enabled:
      !disabled &&
      (Boolean(anchorEl) ||
        (shouldFetchInitial && !hospitals?.length && hasCheckedLocalStorage) ||
        shouldRefetchHospitals),
    initialPageParam: 1
  } as any)

  const hospitalList = useMemo(() => queryData?.pages?.flatMap((page: any) => page?.result) || [], [queryData])

  const totalHospitals = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  const handleHospitalSelect = async (hospital: any) => {
    if (disabled) return
    updateSelectedHospital(hospital)
    setAnchorEl(null)
    if (hospital?.has_permission) {
      setIsHospitalAccessChecked(true)
    }

    await fetchAndUpdateHospitalStats(hospital.id)
  }

  const handleSearchChange = useCallback(
    (value: string) => {
      if (disabled) return

      setLocalSearch(value)
      debouncedSearch(value)
    },
    [disabled, debouncedSearch]
  )

  const handleSearchClear = useCallback(() => {
    setLocalSearch('')
    debouncedSearch('')
  }, [debouncedSearch])

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

  useEffect(() => {
    if (!anchorEl) {
      setLocalSearch('')
      setSearchQuery('')
      cooldownRef.current = false
    }
  }, [anchorEl])

  const checkHospitalAccess = async () => {
    if (hasCheckedLocalStorage) return

    const storedHospital: any = read('selectedHospital')

    if (storedHospital && storedHospital.id) {
      setIsCheckingHospitalAccess(true)
      try {
        const detailResponse: any = await fetchHospitalDetail(storedHospital.id)

        if (detailResponse?.status) {
          const hospitalData = detailResponse.data

          if (hospitalData?.has_permission) {
            updateSelectedHospital({
              ...storedHospital
            })
            setIsHospitalAccessChecked(true)
            setIsCheckingHospitalAccess(false)

            await fetchAndUpdateHospitalStats(hospitalData.id)
          } else {
            updateSelectedHospital(null)

            setShouldRefetchHospitals(true)

            queryClient.invalidateQueries({ queryKey: ['hospitals-listing-inpatient'] })

            console.warn('User does not have access to the stored hospital:', storedHospital.name)
          }
        } else {
          updateSelectedHospital(null)

          setShouldRefetchHospitals(true)
        }
      } catch (error) {
        console.error('Error checking hospital access:', error)
        updateSelectedHospital(null)

        setShouldRefetchHospitals(true)
      } finally {
        if (isCheckingHospitalAccess) setIsCheckingHospitalAccess(false)
        setHasCheckedLocalStorage(true)
      }
    } else {
      setHasCheckedLocalStorage(true)
    }
  }

  useEffect(() => {
    if (!hasFetchedStatsForCurrentHospital) checkHospitalAccess()
  }, [])

  useEffect(() => {
    if (
      hospitalList.length > 0 &&
      !selectedHospital &&
      !isFetching &&
      hasCheckedLocalStorage &&
      !isCheckingHospitalAccess
    ) {
      handleHospitalSelect(hospitalList[0])
    }
  }, [hospitalList, selectedHospital, isFetching, isCheckingHospitalAccess, hasCheckedLocalStorage, disabled])

  useEffect(() => {
    if (shouldRefetchHospitals && hospitalList.length > 0) {
      handleHospitalSelect(hospitalList[0])
      setIsCheckingHospitalAccess(false)
      setShouldRefetchHospitals(false)
    }
  }, [shouldRefetchHospitals, hospitalList])

  const handleDropdownClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return
    setAnchorEl(e.currentTarget)

    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  useEffect(() => {
    if (anchorEl) {

      const timer = setTimeout(() => {

        const menuElement = document.querySelector('[role="menu"]')
        if (menuElement) {
          const input = menuElement.querySelector('input')
          if (input) {
            input.focus()
          }
        }
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [anchorEl])

  const ShimmerBox = ({ width = '100%', height = '20px', mb = 1 }: any) => (
    <Box
      sx={{
        width,
        height,
        mb,
        backgroundColor: theme.palette.grey[300],
        borderRadius: '4px',
        animation: 'pulse 1.5s ease-in-out infinite',
        '@keyframes pulse': {
          '0%': { opacity: 0.7 },
          '50%': { opacity: 0.9 },
          '100%': { opacity: 0.7 }
        }
      }}
    />
  )

  return (
    <Box>
      <Box
        onClick={handleDropdownClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: disabled ? 'default' : 'pointer',
          border: Boolean(anchorEl) ? `1px solid ${theme.palette.customColors.OnSurface}` : 'none',
          borderRadius: '4px',
          backgroundColor: Boolean(anchorEl) ? theme.palette.customColors.Surface : 'transparent',
          px: '16px',
          py: '6px',
          '&:hover': {
            backgroundColor: disabled ? 'transparent' : theme.palette.action.hover
          }
        }}
      >
        <Box sx={{ maxWidth: 400, display: 'flex', alignItems: 'center' }}>
          {hasNoHospitalsOnInitialFetch ? (
            <Box>{t('hospital_module.no_hospitals_found')}</Box>
          ) : isCheckingHospitalAccess ? (
            (<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              <ShimmerBox width='160px' height='24px' mb={0} />
              <ShimmerBox width='120px' height='16px' mb={0} />
            </Box>)
          ) : selectedHospital?.name ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: 400
              }}
            >
              <Tooltip title={selectedHospital?.name}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '20px',
                    color: theme.palette.customColors.OnSurfaceVariant,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {selectedHospital.name}
                </Typography>
              </Tooltip>
              {selectedHospital?.site_name && (
                <Tooltip title={selectedHospital?.site_name || '-'}>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontSize: '14px'
                    }}
                  >
                    {selectedHospital?.site_name || '-'}
                  </Typography>
                </Tooltip>
              )}
            </Box>
          ) : (
            (<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              <ShimmerBox width='160px' height='24px' mb={0} />
              <ShimmerBox width='120px' height='16px' mb={0} />
            </Box>)
          )}
        </Box>

        {!disabled && <KeyboardArrowDown />}
      </Box>
      {!disabled && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              width: 320,
              maxHeight: 400,
              p: 0
            }
          }}
        >
          <Box sx={{ p: 4 }}>
            <Search
              ref={searchInputRef}
              value={localSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
              onClear={handleSearchClear}
              placeholder={(t('hospital_module.search_hospital') as string)}
            />
          </Box>

          <Box
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              padding: '16px',
              paddingTop: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {isLoading ? (
              (<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: 5 }).map((_, index: number) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, px: '4px' }}>
                    <Box sx={{ flex: 1 }}>
                      <ShimmerBox width='80%' height='18px' mb={1} />
                      <ShimmerBox width='60%' height='14px' mb={0} />
                    </Box>
                  </Box>
                ))}
              </Box>)
            ) : hospitalList.length === 0 ? (
              <MenuItem disabled>{searchQuery ? t('hospital_module.no_hospitals_found') : t('hospital_module.no_hospitals_available')}</MenuItem>
            ) : (
              hospitalList.map((hospital: any) => (
                <MenuItem
                  key={hospital.id}
                  onClick={() => handleHospitalSelect(hospital)}
                  selected={selectedHospital?.id === hospital.id}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.customColors.OnBackground,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.OnBackground
                      }
                    },
                    px: '16px',
                    py: '8px',
                    borderRadius: '4px'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                  >
                    <Box sx={{ textAlign: { md: 'left' }, maxWidth: '250px' }}>
                      <Tooltip title={hospital.name}>
                        <Typography
                          sx={{
                            color:
                              selectedHospital?.id === hospital.id
                                ? theme.palette.customColors.OnSurface
                                : theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '16px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {hospital?.name}
                        </Typography>
                      </Tooltip>
                      <Tooltip title={hospital.site_name}>
                        <Typography
                          variant='body2'
                          sx={{
                            color:
                              selectedHospital?.id === hospital.id
                                ? theme.palette.customColors.OnSurfaceVariant
                                : theme.palette.customColors.neutralSecondary,
                            fontSize: '14px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {hospital.site_name}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}

            {(isFetchingNextPage || hasNextPage) && hospitalList.length > 0 && (
              <Box ref={loaderRef} sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 2 }}>
                {Array.from({ length: 2 }).map((_, index: number) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: '4px' }}>
                    <Box sx={{ flex: 1 }}>
                      <ShimmerBox width='70%' height='16px' mb={1} />
                      <ShimmerBox width='50%' height='12px' mb={0} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {!hasNextPage && hospitalList.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                <Typography color='text.secondary'>{t('hospital_module.no_more_results')}</Typography>
              </Box>
            )}
          </Box>
        </Menu>
      )}
    </Box>
  );
}

export default HospitalDropdown
