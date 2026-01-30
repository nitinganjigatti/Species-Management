// components/NecropsyDropdown.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react'
import { Box, Typography, Menu, MenuItem, useTheme, Tooltip, Avatar } from '@mui/material'
import { KeyboardArrowDown, Biotech } from '@mui/icons-material'
import { useNecropsy } from 'src/context/NecropsyContext'
import Search from 'src/views/utility/Search'
import debounce from 'lodash/debounce'
import { read } from 'src/lib/windows/utils'
import { AuthContext } from 'src/context/AuthContext'

const NecropsyDropdown = ({ disabled = false }) => {
  const theme = useTheme()

  const {
    selectedNecropsy,
    updateSelectedNecropsy,
    necropsies,
    isLoadingNecropsies,
    fetchNecropsies,
    hasCompletedInitialFetch
  } = useNecropsy()

  const [anchorEl, setAnchorEl] = useState(null)
  const [localSearch, setLocalSearch] = useState('')
  const [isCheckingNecropsyAccess, setIsCheckingNecropsyAccess] = useState(false)
  const [hasValidatedAccess, setHasValidatedAccess] = useState(false)
  const searchInputRef = useRef(null)

  const authData = useContext(AuthContext)
  const userId = authData?.userData?.user?.user_id || ''

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchNecropsies(userId)
    }
  }, [userId])

  // Validation Flow: Check stored necropsy against fetched list
  useEffect(() => {
    if (necropsies.length > 0 && !hasValidatedAccess) {
      setIsCheckingNecropsyAccess(true)
      const storedNecropsy = read('selectedNecropsy')

      if (storedNecropsy && storedNecropsy.id) {
        const isHavingAccess = necropsies.find(n => n.id === storedNecropsy.id)

        if (isHavingAccess) {
          updateSelectedNecropsy(isHavingAccess)
        } else {
          // If stored is invalid, pick the first one
          updateSelectedNecropsy(necropsies[0])
        }
      } else {
        // No stored, pick the first one
        updateSelectedNecropsy(necropsies[0])
      }
      setHasValidatedAccess(true)
      setIsCheckingNecropsyAccess(false)
    } else if (hasCompletedInitialFetch && necropsies.length === 0) {
      updateSelectedNecropsy(null)
    }
  }, [necropsies, hasCompletedInitialFetch, hasValidatedAccess, updateSelectedNecropsy])

  // Create debounced search function
  const debouncedSearch = useRef(
    debounce(searchValue => {
      fetchNecropsies(userId, searchValue)
    }, 500)
  ).current

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleNecropsySelect = necropsy => {
    if (disabled) return
    updateSelectedNecropsy(necropsy)
    setAnchorEl(null)
  }

  // Search handler
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
    fetchNecropsies(userId, '')
  }, [userId, fetchNecropsies])

  // Reset search when dropdown closes
  useEffect(() => {
    if (!anchorEl && localSearch) {
      // If we had a search term, reset it when closed
      setLocalSearch('')
      fetchNecropsies(userId, '')
    }
  }, [anchorEl, localSearch, userId, fetchNecropsies])

  const handleDropdownClick = e => {
    if (disabled) return
    setAnchorEl(e.currentTarget)
  }

  // Focus search when menu opens
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
          {isLoadingNecropsies || isCheckingNecropsyAccess ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              <ShimmerBox width='160px' height='24px' mb={0} />
              <ShimmerBox width='120px' height='16px' mb={0} />
            </Box>
          ) : selectedNecropsy?.name ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                maxWidth: 400,
                backgroundColor: theme.palette.customColors.background
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: theme.palette.customColors.antzNotes80,
                  borderRadius: '8px',
                  p: '8px'
                }}
              >
                <Biotech sx={{ fontSize: 32, color: theme.palette.customColors.OnSurfaceVariant }} />
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                <Tooltip title={selectedNecropsy?.name}>
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
                    {selectedNecropsy.name}
                  </Typography>
                </Tooltip>
                {selectedNecropsy?.site_name && (
                  <Tooltip title={selectedNecropsy?.site_name || '-'}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontSize: '14px'
                      }}
                    >
                      {selectedNecropsy?.site_name || '-'}
                    </Typography>
                  </Tooltip>
                )}
              </Box>
            </Box>
          ) : (
            <Box>No necropsy centers found</Box>
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
              onChange={e => handleSearchChange(e.target.value)}
              onClear={handleSearchClear}
              placeholder='Search necropsy centers...'
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
            {isLoadingNecropsies ? (
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
            ) : necropsies.length === 0 ? (
              <MenuItem disabled>
                {localSearch ? 'No necropsy centers found' : 'No necropsy centers available'}
              </MenuItem>
            ) : (
              necropsies.map(necropsy => (
                <MenuItem
                  key={necropsy.id}
                  fullWidth
                  onClick={() => handleNecropsySelect(necropsy)}
                  selected={selectedNecropsy?.id === necropsy.id}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ textAlign: { md: 'left' }, maxWidth: '250px' }}>
                      <Tooltip title={necropsy.name}>
                        <Typography
                          sx={{
                            color:
                              selectedNecropsy?.id === necropsy.id
                                ? theme.palette.customColors.OnSurface
                                : theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '16px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {necropsy?.name}
                        </Typography>
                      </Tooltip>
                      <Tooltip title={necropsy.site_name}>
                        <Typography
                          variant='body2'
                          sx={{
                            color:
                              selectedNecropsy?.id === necropsy.id
                                ? theme.palette.customColors.OnSurfaceVariant
                                : theme.palette.customColors.neutralSecondary,
                            fontSize: '14px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {necropsy.site_name}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Box>
        </Menu>
      )}
    </Box>
  )
}

export default NecropsyDropdown
