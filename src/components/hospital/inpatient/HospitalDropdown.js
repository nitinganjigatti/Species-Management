// components/HospitalDropdown.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Typography, Menu, MenuItem, CircularProgress, useTheme, Tooltip, Avatar } from '@mui/material'
import { KeyboardArrowDown } from '@mui/icons-material'
import { useHospital } from 'src/context/HospitalContext'
import { getHospitalBedStats, getHospitalListing } from 'src/lib/api/hospital/hospitalAnalytics'
import useDebounce from 'src/hooks/useDebounce'
import Search from 'src/views/utility/Search'

const HospitalDropdown = ({ disabled = false }) => {
  const theme = useTheme()

  const {
    selectedHospital,
    hospitals,
    updateSelectedHospital,
    updateHospitals,
    updateHospitalStats,
    setHospitalStatsLoading
  } = useHospital()

  const [anchorEl, setAnchorEl] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPages, setTotalPages] = useState(1)

  // Use debounced search query (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Ref to track if it's the initial load
  const initialLoadRef = useRef(true)

  const fetchHospitals = useCallback(
    async (pageNum = 1, append = false, search = '') => {
      if (loading || loadingMore) return

      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const params = {
          page: pageNum,
          limit: 10,
          q: search?.trim()
        }
        const response = await getHospitalListing(params)

        if (response?.success) {
          const newHospitals = response.data.hospitals
          updateHospitals(append ? [...hospitals, ...newHospitals] : newHospitals, false)
          setTotalPages(response.data.total_pages)
          setHasMore(pageNum < response.data.total_pages)

          // Auto-select first hospital if it's the first page and no hospital is selected
          if (pageNum === 1 && newHospitals.length > 0 && !selectedHospital) {
            await handleHospitalSelect(newHospitals[0])
          }
        }
      } catch (error) {
        console.error('Error fetching hospitals:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [hospitals, selectedHospital, loading, loadingMore, updateHospitals]
  )

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

  const handleSearchChange = value => {
    if (disabled) return

    setSearchQuery(value)

    // Reset pagination for new search
    setPage(1)
    setHasMore(true)
  }

  const handleScroll = useCallback(
    event => {
      if (disabled) return

      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
      if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loadingMore) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchHospitals(nextPage, true, debouncedSearchQuery)
      }
    },
    [page, hasMore, loadingMore, debouncedSearchQuery, fetchHospitals, disabled]
  )

  const handleDropdownClick = e => {
    if (disabled) return
    setAnchorEl(e.currentTarget)
  }

  // Effect to handle debounced search
  useEffect(() => {
    if (disabled) return

    if (initialLoadRef.current) {
      initialLoadRef.current = false

      return
    }

    // Fetch hospitals when debounced search query changes
    fetchHospitals(1, false, debouncedSearchQuery)
  }, [debouncedSearchQuery, disabled])

  // Effect to fetch initial hospitals
  useEffect(() => {
    if (disabled) return

    if (!selectedHospital && hospitals.length === 0) {
      fetchHospitals(1, false, '')
    }
  }, [disabled]) // Added disabled to dependency array

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
            <CircularProgress size={24} />
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
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onClear={() => handleSearchChange('')}
              placeholder='Search hospitals...'
            />
          </Box>

          {/* Hospital List */}
          <Box
            onScroll={handleScroll}
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
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : hospitals.length === 0 ? (
              <MenuItem disabled>{searchQuery ? 'No hospitals found' : 'No hospitals available'}</MenuItem>
            ) : (
              hospitals.map(hospital => (
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

            {/* Loading More Indicator */}
            {loadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}

            {/* No More Results */}
            {!hasMore && hospitals.length > 0 && (
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