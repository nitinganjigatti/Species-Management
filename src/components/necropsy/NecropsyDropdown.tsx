import React, { useState, useEffect, useCallback, useRef, useContext, FC, memo } from 'react'
import { Box, Typography, Menu, MenuItem, useTheme, Tooltip, Avatar, Theme, SxProps } from '@mui/material'
import { KeyboardArrowDown } from '@mui/icons-material'
import Search from 'src/views/utility/Search'
import debounce from 'lodash/debounce'
import { read } from 'src/lib/windows/utils'
import { AuthContext } from 'src/context/AuthContext'
import { useNecropsyCenter } from 'src/hooks/necropsy'
import { NecropsyCenter } from 'src/types/necropsy'

interface NecropsyDropdownProps {
  disabled?: boolean
}

interface ShimmerBoxProps {
  width?: string | number
  height?: string | number
  mb?: number
}

const NecropsyDropdown: FC<NecropsyDropdownProps> = ({ disabled = false }) => {
  const theme = useTheme<Theme>()

  const authData = useContext(AuthContext) as unknown as { userData?: { user?: { user_id?: string | number } } } | null
  const userId = Number(authData?.userData?.user?.user_id) || 0

  const {
    selectedCenter: selectedNecropsy,
    centers: necropsies,
    centersLoading: isLoadingNecropsies,
    fetchCenters: fetchNecropsies,
    updateSelectedCenter: updateSelectedNecropsy
  } = useNecropsyCenter(userId, true)

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [localSearch, setLocalSearch] = useState<string>('')
  const [isCheckingNecropsyAccess, setIsCheckingNecropsyAccess] = useState<boolean>(false)
  const [hasValidatedAccess, setHasValidatedAccess] = useState<boolean>(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (necropsies.length > 0 && !hasValidatedAccess) {
      setIsCheckingNecropsyAccess(true)
      const storedNecropsy = read('selectedNecropsy') as NecropsyCenter | null

      if (storedNecropsy && storedNecropsy.id) {
        const isHavingAccess = necropsies.find((n: NecropsyCenter) => n.id === storedNecropsy.id)

        if (isHavingAccess) {
          updateSelectedNecropsy(isHavingAccess)
        } else {
          updateSelectedNecropsy(necropsies[0])
        }
      } else {
        updateSelectedNecropsy(necropsies[0])
      }
      setHasValidatedAccess(true)
      setIsCheckingNecropsyAccess(false)
    } else if (!isLoadingNecropsies && necropsies.length === 0 && hasValidatedAccess) {
      updateSelectedNecropsy(null)
    }
  }, [necropsies, isLoadingNecropsies, hasValidatedAccess, updateSelectedNecropsy])

  const debouncedSearch = useRef(
    debounce((searchValue: string) => {
      fetchNecropsies(searchValue)
    }, 500)
  ).current

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleNecropsySelect = (necropsy: NecropsyCenter): void => {
    if (disabled) return
    updateSelectedNecropsy(necropsy)
    setAnchorEl(null)
  }

  const handleSearchChange = useCallback(
    (value: string): void => {
      if (disabled) return
      setLocalSearch(value)
      debouncedSearch(value)
    },
    [disabled, debouncedSearch]
  )

  const handleSearchClear = useCallback((): void => {
    setLocalSearch('')
    fetchNecropsies('')
  }, [fetchNecropsies])

  useEffect(() => {
    if (!anchorEl && localSearch) {
      setLocalSearch('')
      fetchNecropsies('')
    }
  }, [anchorEl, localSearch, fetchNecropsies])

  const handleDropdownClick = (e: React.MouseEvent<HTMLElement>): void => {
    if (disabled) return
    setAnchorEl(e.currentTarget)
  }

  useEffect(() => {
    if (anchorEl) {
      const timer = setTimeout(() => {
        const menuElement = document.querySelector('[role="menu"]')
        if (menuElement) {
          const input = menuElement.querySelector('input') as HTMLInputElement | null
          if (input) {
            input.focus()
          }
        }
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [anchorEl])

  const ShimmerBox: FC<ShimmerBoxProps> = ({ width = '100%', height = '20px', mb = 1 }) => (
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
          border: Boolean(anchorEl) ? `1px solid ${(theme.palette as any).customColors?.OnSurface}` : 'none',
          borderRadius: '4px',
          backgroundColor: Boolean(anchorEl)
            ? (theme.palette as any).customColors?.Surface
            : (theme.palette as any).customColors?.OnPrimary,
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
                maxWidth: 400
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: (theme.palette as any).customColors?.TertiaryContainer,
                  borderRadius: '8px',
                  p: '8px'
                }}
              >
                <img src={'/images/necropsy/necropsy_main.svg'} alt='necropsy' />
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tooltip title={selectedNecropsy?.name}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '20px',
                        color: (theme.palette as any).customColors?.OnSurfaceVariant,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {selectedNecropsy.name}
                    </Typography>
                  </Tooltip>
                  {!disabled && <KeyboardArrowDown />}
                </Box>
                {selectedNecropsy?.site_name && (
                  <Tooltip title={selectedNecropsy?.site_name || '-'}>
                    <Typography
                      sx={{
                        color: (theme.palette as any).customColors?.OnSurfaceVariant,
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
              necropsies.map((necropsy: NecropsyCenter) => (
                <MenuItem
                  key={necropsy.id}
                  onClick={() => handleNecropsySelect(necropsy)}
                  selected={selectedNecropsy?.id === necropsy.id}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: (theme.palette as any).customColors?.OnBackground,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main
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
                                ? (theme.palette as any).customColors?.OnSurface
                                : (theme.palette as any).customColors?.OnSurfaceVariant,
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
                                ? (theme.palette as any).customColors?.OnSurfaceVariant
                                : (theme.palette as any).customColors?.neutralSecondary,
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

export default memo(NecropsyDropdown)
