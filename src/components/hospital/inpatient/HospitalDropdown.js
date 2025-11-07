// components/HospitalDropdown.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Box, Typography, Menu, MenuItem, CircularProgress, useTheme, Tooltip, Avatar } from '@mui/material'
import { KeyboardArrowDown } from '@mui/icons-material'
import { useHospital } from 'src/context/HospitalContext'
import { getHospitalBedStats, getHospitalListing } from 'src/lib/api/hospital/hospitalAnalytics'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import Search from 'src/views/utility/Search'
import debounce from 'lodash/debounce'
import { read } from 'src/lib/windows/utils'

const HospitalDropdown = ({ disabled = false }) => {
  const theme = useTheme()

  const {
    selectedHospital,
    hospitals,
    updateSelectedHospital,
    updateHospitals,
    hospitalStats,
    updateHospitalStats,
    setHospitalStatsLoading
  } = useHospital()

  const [anchorEl, setAnchorEl] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const searchInputRef = useRef(null)

  const PAGE_SIZE = 10

  // Use intersection observer for infinite scroll
  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  // Cooldown ref to prevent multiple rapid calls
  const cooldownRef = useRef(false)

  // Track if we need to fetch initial data
  const shouldFetchInitial = useMemo(() => !disabled && !selectedHospital, [disabled, selectedHospital])

  // Create debounced search function with useRef to persist across renders
  const debouncedSearch = useRef(
    debounce(searchValue => {
      setSearchQuery(searchValue)
    }, 500)
  ).current

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Infinite query for hospitals - always enabled for initial fetch
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['hospitals-inpatient', searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: PAGE_SIZE,
        q: searchQuery?.trim()
      }

      const response = await getHospitalListing(params)

      if (response?.success) {
        const newHospitals = response.data.hospitals || []
        const totalPages = response.data.total_pages || 1

        return {
          result: newHospitals,
          nextPage: pageParam < totalPages ? pageParam + 1 : undefined,
          total: response.data.total_count || newHospitals.length
        }
      } else {
        throw new Error(response?.message || 'Failed to fetch hospitals')
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: !disabled && (Boolean(anchorEl) || (shouldFetchInitial && !hospitals?.length)), // Fetch when dropdown is open OR when we need initial data
  })

  // Flatten all pages into a single list
  const hospitalList = useMemo(() => queryData?.pages?.flatMap(page => page?.result) || [], [queryData])

  const totalHospitals = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  const handleHospitalSelect = async hospital => {
    if (disabled) return

    updateSelectedHospital(hospital)
    setAnchorEl(null)

    try {
      setHospitalStatsLoading(true)
      const statsResponse = await getHospitalBedStats(hospital.id)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching hospital stats:', error)
    } finally {
      setHospitalStatsLoading(false)
    }
  }

  // Search handler with proper debouncing
  const handleSearchChange = useCallback(
    value => {
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

  // Load more hospitals when scrolled to bottom
  const loadMore = useCallback(() => {
    if (cooldownRef.current) return
    if (!isFetchingNextPage && hasNextPage) {
      cooldownRef.current = true
      fetchNextPage().finally(() => {
        // Add 300ms cooldown before allowing next fetch
        setTimeout(() => {
          cooldownRef.current = false
        }, 300)
      })
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  // Trigger load more when intersection observer detects the loader
  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  // Reset search when dropdown closes
  useEffect(() => {
    if (!anchorEl) {
      setLocalSearch('')
      setSearchQuery('')
      cooldownRef.current = false
    }
  }, [anchorEl])

  // Auto-select first hospital when data loads and no hospital is selected
  useEffect(() => {
    if (hospitalList.length > 0 && !selectedHospital && !isFetching) {
      handleHospitalSelect(hospitalList[0])
    }
  }, [hospitalList, selectedHospital, isFetching])


  useEffect(() => {
    if (selectedHospital && !hospitalStats) {
      handleHospitalSelect(read('selectedHospital'))
    }
  }, [])

  const handleDropdownClick = e => {
    if (disabled) return
    setAnchorEl(e.currentTarget)

    // Focus search input immediately
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Shimmer component for loading states
  const ShimmerBox = ({ width = '100%', height = '20px', mb = 1 }) => (
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
      {/* Hospital Selection Button */}
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
        <Box sx={{ maxWidth: 200, display: 'flex', alignItems: 'center' }}>
          {selectedHospital?.hospital_name ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: 200
              }}
            >
              <Tooltip title={selectedHospital.hospital_name}>
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
                  {selectedHospital.hospital_name}
                </Typography>
              </Tooltip>
              <Tooltip title={selectedHospital?.location || '-'}>
                <Typography
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    fontSize: '14px'
                  }}
                >
                  {selectedHospital?.location || '-'}
                </Typography>
              </Tooltip>
            </Box>
          ) : (

            // Shimmer for initial loading state
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              <ShimmerBox width='160px' height='24px' mb={0} />
              <ShimmerBox width='120px' height='16px' mb={0} />
            </Box>
          )}
        </Box>

        {/* Conditionally render dropdown arrow */}
        {!disabled && <KeyboardArrowDown />}
      </Box>

      {/* Dropdown Menu - Only show if not disabled */}
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
          {/* Search Field */}
          <Box sx={{ p: 4 }}>
            <Search
              ref={searchInputRef}
              value={localSearch}
              onChange={e => handleSearchChange(e.target.value)}
              onClear={handleSearchClear}
              placeholder='Search hospitals...'
            />
          </Box>

          {/* Hospital List */}
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

              // Shimmer for initial loading of hospital list
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, px: '4px' }}>
                    <Box sx={{ flex: 1 }}>
                      <ShimmerBox width='80%' height='18px' mb={1} />
                      <ShimmerBox width='60%' height='14px' mb={0} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : hospitalList.length === 0 ? (
              <MenuItem disabled>{searchQuery ? 'No hospitals found' : 'No hospitals available'}</MenuItem>
            ) : (
              hospitalList.map(hospital => (
                <MenuItem
                  key={hospital.id}
                  fullWidth
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
                      <Tooltip title={hospital.hospital_name}>
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
                          {hospital.hospital_name}
                        </Typography>
                      </Tooltip>
                      <Tooltip title={hospital.location}>
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
                          {hospital.location}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}

            {/* Loading More Indicator with Shimmer */}
            {(isFetchingNextPage || hasNextPage) && hospitalList.length > 0 && (
              <Box ref={loaderRef} sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 2 }}>
                {Array.from({ length: 2 }).map((_, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: '4px' }}>
                    <Box sx={{ flex: 1 }}>
                      <ShimmerBox width='70%' height='16px' mb={1} />
                      <ShimmerBox width='50%' height='12px' mb={0} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* No More Results */}
            {!hasNextPage && hospitalList.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                <Typography color='text.secondary'>No more results</Typography>
              </Box>
            )}
          </Box>
        </Menu>
      )}
    </Box>
  )
}

export default HospitalDropdown

// // components/HospitalDropdown.jsx
// import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
// import { Box, Typography, Menu, MenuItem, CircularProgress, useTheme, Tooltip, Avatar } from '@mui/material'
// import { KeyboardArrowDown } from '@mui/icons-material'
// import { useHospital } from 'src/context/HospitalContext'
// import { getHospitalBedStats, getHospitalListing } from 'src/lib/api/hospital/hospitalAnalytics'
// import { useInfiniteQuery } from '@tanstack/react-query'
// import { useInView } from 'react-intersection-observer'
// import Search from 'src/views/utility/Search'
// import debounce from 'lodash/debounce'
// import { read } from 'src/lib/windows/utils'

// const HospitalDropdown = ({ disabled = false }) => {
//   const theme = useTheme()

//   const {
//     selectedHospital,
//     hospitals,
//     updateSelectedHospital,
//     updateHospitals,
//     hospitalStats,
//     updateHospitalStats,
//     setHospitalStatsLoading
//   } = useHospital()

//   const [anchorEl, setAnchorEl] = useState(null)
//   const [searchQuery, setSearchQuery] = useState('')
//   const [localSearch, setLocalSearch] = useState('')
//   const searchInputRef = useRef(null)

//   const PAGE_SIZE = 10

//   // Use intersection observer for infinite scroll
//   const { ref: loaderRef, inView } = useInView({ threshold: 0 })

//   // Track if we need to fetch initial data
//   const shouldFetchInitial = useMemo(() => !disabled && !selectedHospital, [disabled, selectedHospital])

//   // Create debounced search function with useRef to persist across renders
//   const debouncedSearch = useRef(
//     debounce(searchValue => {
//       setSearchQuery(searchValue)
//     }, 500)
//   ).current

//   // Cleanup debounce on unmount
//   useEffect(() => {
//     return () => {
//       debouncedSearch.cancel()
//     }
//   }, [debouncedSearch])

//   // Infinite query for hospitals - always enabled for initial fetch
//   const {
//     data: queryData,
//     fetchNextPage,
//     hasNextPage,
//     isFetching,
//     isFetchingNextPage,
//     isLoading
//   } = useInfiniteQuery({
//     queryKey: ['hospitals-inpatient', searchQuery],
//     queryFn: async ({ pageParam = 1 }) => {
//       const params = {
//         page: pageParam,
//         limit: PAGE_SIZE,
//         q: searchQuery?.trim()
//       }

//       const response = await getHospitalListing(params)

//       if (response?.success) {
//         const newHospitals = response.data.hospitals || []
//         const totalPages = response.data.total_pages || 1

//         return {
//           result: newHospitals,
//           nextPage: pageParam < totalPages ? pageParam + 1 : undefined,
//           total: response.data.total_count || newHospitals.length
//         }
//       } else {
//         throw new Error(response?.message || 'Failed to fetch hospitals')
//       }
//     },
//     getNextPageParam: lastPage => lastPage.nextPage,
//     enabled: !disabled && (Boolean(anchorEl) || (shouldFetchInitial && !hospitals?.length)) // Fetch when dropdown is open OR when we need initial data
//   })

//   // Flatten all pages into a single list
//   const hospitalList = useMemo(() => queryData?.pages?.flatMap(page => page?.result) || [], [queryData])

//   const totalHospitals = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

//   const handleHospitalSelect = async hospital => {
//     if (disabled) return

//     updateSelectedHospital(hospital)
//     setAnchorEl(null)

//     try {
//       setHospitalStatsLoading(true)
//       const statsResponse = await getHospitalBedStats(hospital.id)
//       if (statsResponse?.success) {
//         console.log("statsResponse.data", statsResponse.data)
//         updateHospitalStats(statsResponse.data)
//       }
//     } catch (error) {
//       console.error('Error fetching hospital stats:', error)
//     } finally {
//       setHospitalStatsLoading(false)
//     }
//   }

//   // Search handler with proper debouncing
//   const handleSearchChange = useCallback(
//     value => {
//       if (disabled) return

//       setLocalSearch(value)
//       debouncedSearch(value)
//     },
//     [disabled, debouncedSearch]
//   )

//   const handleSearchClear = useCallback(() => {
//     setLocalSearch('')
//     debouncedSearch('')
//   }, [debouncedSearch])

//   // Load more hospitals when scrolled to bottom
//   const loadMore = useCallback(() => {
//     if (!isFetchingNextPage && hasNextPage) {
//       fetchNextPage()
//     }
//   }, [isFetchingNextPage, hasNextPage, fetchNextPage])

//   // Trigger load more when intersection observer detects the loader
//   useEffect(() => {
//     if (inView) {
//       loadMore()
//     }
//   }, [inView, loadMore])

//   // Reset search when dropdown closes
//   useEffect(() => {
//     if (!anchorEl) {
//       setLocalSearch('')
//       setSearchQuery('')
//     }
//   }, [anchorEl])

//   // Auto-select first hospital when data loads and no hospital is selected
//   useEffect(() => {
//     if (hospitalList.length > 0 && !selectedHospital && !isFetching) {
//       handleHospitalSelect(hospitalList[0])
//     }
//   }, [hospitalList, selectedHospital, isFetching])


//   useEffect(() => {
//     if (selectedHospital && !hospitalStats) {
//       handleHospitalSelect(read('selectedHospital'))
//     }
//   }, [])

//   const handleDropdownClick = e => {
//     if (disabled) return
//     setAnchorEl(e.currentTarget)

//     // Focus search input immediately
//     if (searchInputRef.current) {
//       searchInputRef.current.focus()
//     }
//   }

//   // Shimmer component for loading states
//   const ShimmerBox = ({ width = '100%', height = '20px', mb = 1 }) => (
//     <Box
//       sx={{
//         width,
//         height,
//         mb,
//         backgroundColor: theme.palette.grey[300],
//         borderRadius: '4px',
//         animation: 'pulse 1.5s ease-in-out infinite',
//         '@keyframes pulse': {
//           '0%': { opacity: 0.7 },
//           '50%': { opacity: 0.9 },
//           '100%': { opacity: 0.7 }
//         }
//       }}
//     />
//   )

//   return (
//     <Box>
//       {/* Hospital Selection Button */}
//       <Box
//         onClick={handleDropdownClick}
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '16px',
//           cursor: disabled ? 'default' : 'pointer',
//           border: Boolean(anchorEl) ? `1px solid ${theme.palette.customColors.OnSurface}` : 'none',
//           borderRadius: '4px',
//           backgroundColor: Boolean(anchorEl) ? theme.palette.customColors.Surface : 'transparent',
//           px: '16px',
//           py: '6px',
//           '&:hover': {
//             backgroundColor: disabled ? 'transparent' : theme.palette.action.hover
//           }
//         }}
//       >
//         <Box sx={{ maxWidth: 200, display: 'flex', alignItems: 'center' }}>
//           {selectedHospital?.hospital_name ? (
//             <Box
//               sx={{
//                 display: 'flex',
//                 flexDirection: 'column',
//                 maxWidth: 200
//               }}
//             >
//               <Tooltip title={selectedHospital.hospital_name}>
//                 <Typography
//                   sx={{
//                     fontWeight: 500,
//                     fontSize: '20px',
//                     color: theme.palette.customColors.OnSurfaceVariant,
//                     whiteSpace: 'nowrap',
//                     overflow: 'hidden',
//                     textOverflow: 'ellipsis'
//                   }}
//                 >
//                   {selectedHospital.hospital_name}
//                 </Typography>
//               </Tooltip>
//               <Tooltip title={selectedHospital?.location || '-'}>
//                 <Typography
//                   sx={{
//                     color: theme.palette.customColors.OnSurfaceVariant,
//                     fontSize: '14px'
//                   }}
//                 >
//                   {selectedHospital?.location || '-'}
//                 </Typography>
//               </Tooltip>
//             </Box>
//           ) : (

//             // Shimmer for initial loading state
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
//               <ShimmerBox width='160px' height='24px' mb={0} />
//               <ShimmerBox width='120px' height='16px' mb={0} />
//             </Box>
//           )}
//         </Box>

//         {/* Conditionally render dropdown arrow */}
//         {!disabled && <KeyboardArrowDown />}
//       </Box>

//       {/* Dropdown Menu - Only show if not disabled */}
//       {!disabled && (
//         <Menu
//           anchorEl={anchorEl}
//           open={Boolean(anchorEl)}
//           onClose={() => setAnchorEl(null)}
//           PaperProps={{
//             sx: {
//               width: 320,
//               maxHeight: 400,
//               p: 0
//             }
//           }}
//         >
//           {/* Search Field */}
//           <Box sx={{ p: 4 }}>
//             <Search
//               ref={searchInputRef}
//               value={localSearch}
//               onChange={e => handleSearchChange(e.target.value)}
//               onClear={handleSearchClear}
//               placeholder='Search hospitals...'
//             />
//           </Box>

//           {/* Hospital List */}
//           <Box
//             sx={{
//               maxHeight: 300,
//               overflow: 'auto',
//               padding: '16px',
//               paddingTop: 0,
//               display: 'flex',
//               flexDirection: 'column',
//               gap: '4px'
//             }}
//           >
//             {isLoading ? (

//               // Shimmer for initial loading of hospital list
//               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//                 {Array.from({ length: 5 }).map((_, index) => (
//                   <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, px: '4px' }}>
//                     <Box sx={{ flex: 1 }}>
//                       <ShimmerBox width='80%' height='18px' mb={1} />
//                       <ShimmerBox width='60%' height='14px' mb={0} />
//                     </Box>
//                   </Box>
//                 ))}
//               </Box>
//             ) : hospitalList.length === 0 ? (
//               <MenuItem disabled>{searchQuery ? 'No hospitals found' : 'No hospitals available'}</MenuItem>
//             ) : (
//               hospitalList.map(hospital => (
//                 <MenuItem
//                   key={hospital.id}
//                   fullWidth
//                   onClick={() => handleHospitalSelect(hospital)}
//                   selected={selectedHospital?.id === hospital.id}
//                   sx={{
//                     '&.Mui-selected': {
//                       backgroundColor: theme.palette.customColors.OnBackground,
//                       '&:hover': {
//                         backgroundColor: theme.palette.primary.OnBackground
//                       }
//                     },
//                     px: '16px',
//                     py: '8px',
//                     borderRadius: '4px'
//                   }}
//                 >
//                   <Box
//                     sx={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: 3
//                     }}
//                   >
//                     <Box sx={{ textAlign: { md: 'left' }, maxWidth: '250px' }}>
//                       <Tooltip title={hospital.hospital_name}>
//                         <Typography
//                           sx={{
//                             color:
//                               selectedHospital?.id === hospital.id
//                                 ? theme.palette.customColors.OnSurface
//                                 : theme.palette.customColors.OnSurfaceVariant,
//                             fontSize: '16px',
//                             fontWeight: 500,
//                             whiteSpace: 'nowrap',
//                             overflow: 'hidden',
//                             textOverflow: 'ellipsis'
//                           }}
//                         >
//                           {hospital.hospital_name}
//                         </Typography>
//                       </Tooltip>
//                       <Tooltip title={hospital.location}>
//                         <Typography
//                           variant='body2'
//                           sx={{
//                             color:
//                               selectedHospital?.id === hospital.id
//                                 ? theme.palette.customColors.OnSurfaceVariant
//                                 : theme.palette.customColors.neutralSecondary,
//                             fontSize: '14px',
//                             whiteSpace: 'nowrap',
//                             overflow: 'hidden',
//                             textOverflow: 'ellipsis'
//                           }}
//                         >
//                           {hospital.location}
//                         </Typography>
//                       </Tooltip>
//                     </Box>
//                   </Box>
//                 </MenuItem>
//               ))
//             )}

//             {/* Loading More Indicator with Shimmer */}
//             {(isFetchingNextPage || hasNextPage) && hospitalList.length > 0 && (
//               <Box ref={loaderRef} sx={{ display: 'flex', flexDirection: 'column', gap: 4, p: 2 }}>
//                 {Array.from({ length: 2 }).map((_, index) => (
//                   <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: '4px' }}>
//                     <Box sx={{ flex: 1 }}>
//                       <ShimmerBox width='70%' height='16px' mb={1} />
//                       <ShimmerBox width='50%' height='12px' mb={0} />
//                     </Box>
//                   </Box>
//                 ))}
//               </Box>
//             )}

//             {/* No More Results */}
//             {!hasNextPage && hospitalList.length > 0 && (
//               <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
//                 <Typography color='text.secondary'>No more results</Typography>
//               </Box>
//             )}
//           </Box>
//         </Menu>
//       )}
//     </Box>
//   )
// }

// export default HospitalDropdown