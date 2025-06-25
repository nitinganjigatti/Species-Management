import { LoadingButton } from '@mui/lab'
import { Drawer, IconButton, TextField, Typography, CircularProgress } from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import debounce from 'lodash/debounce'
import { getTaxonomyListForReport } from 'src/lib/api/report'
import { AuthContext } from 'src/context/AuthContext'

function AssessmentSpeciesFilter({ selectedSpecie, setSelectedSpecie, openspeciesFilter, setOpenspeciesFilter }) {
  const theme = useTheme()
  const drawerContentRef = useRef(null)
  const authData = useContext(AuthContext)
  const zoo_id = authData.userData.user.zoos[0]?.zoo_id

  const [tempSelectedSpecie, setTempSelectedSpecie] = useState(selectedSpecie || null)

  const [searchValue, setSearchValue] = useState('')
  const [speciesList, setSpeciesList] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(false)

  const fetchSpecies = async (q = '', pageNum = 1, isNewSearch = false) => {
    if (loading) return
    setLoading(true)

    try {
      const res = await getTaxonomyListForReport({
        zoo_id,
        list_type: 'species',
        q,
        limit: 10,
        page_no: pageNum
      })

      const newSpecies = res?.data?.classification_list || []
      //   const total = res?.data?.data?.total_count || 23
      const total = 23

      setTotalCount(total)

      setSpeciesList(prev => (isNewSearch ? newSpecies : [...prev, ...newSpecies]))

      if ((isNewSearch ? newSpecies.length : speciesList.length + newSpecies.length) >= total) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
    } catch (err) {
      console.error('Failed to fetch taxonomy list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpecies('', 1, true)
  }, [])

  const debouncedSearch = useCallback(
    debounce(value => {
      setPage(1)
      setSpeciesList([])
      setHasMore(true)
      fetchSpecies(value, 1, true)
    }, 500),
    []
  )

  const handleCancelClick = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handleCloseDrawer = () => {
    setOpenspeciesFilter(false)
  }

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleScroll = () => {
    if (!drawerContentRef.current || loading || !hasMore) return
    const { scrollTop, scrollHeight, clientHeight } = drawerContentRef.current
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchSpecies(searchValue, nextPage)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={openspeciesFilter}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      {/* Header */}
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Select Species</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box
        ref={drawerContentRef}
        onScroll={handleScroll}
        sx={{
          overflowY: 'auto',
          flexGrow: 1,
          backgroundColor: 'background.default'
        }}
      >
        <Box sx={{ bgcolor: 'background.default', p: theme => theme.spacing(3, 3.255, 3, 5.255) }}>
          <TextField
            value={searchValue}
            fullWidth
            slotProps={{
              startAdornment: (
                <Icon
                  style={{ marginRight: 10, color: theme.palette.customColors.OnSurfaceVariant }}
                  icon={'ion:search-outline'}
                />
              ),
              endAdornment: searchValue && (
                <IconButton onClick={handleCancelClick} size='small' sx={{ padding: 0 }}>
                  <Icon icon={'ion:close-outline'} style={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                </IconButton>
              )
            }}
            // InputProps={{}}
            placeholder='Search by species name or scientific name'
            onChange={handleSearchChange}
            sx={{
              bgcolor: theme.palette.primary.contrastText,
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: '8px',
              '& .MuiOutlinedInput-root': {
                border: 'none',
                borderColor: theme.palette.customColors.Outline,
                '& fieldset': {
                  border: 'none',
                  borderColor: theme.palette.customColors.Outline
                },
                '& .MuiInputBase-input::placeholder': {
                  color: theme.palette.customColors.OutlineVariant,
                  fontSize: '14px',
                  fontWeight: '400'
                }
              }
            }}
          />

          <Box sx={{ pb: 25, mt: 4, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant,
                letterSpacing: 0,
                lineHeight: '100%'
              }}
            >
              Species{totalCount > 0 && ` (${totalCount})`}
            </Typography>

            {speciesList.length > 0 &&
              speciesList.map((item, index) => {
                const isSelected = tempSelectedSpecie?.tsn_id === item.tsn_id // assuming `item.id` is the unique ID

                return (
                  <Box
                    key={index}
                    onClick={() => setTempSelectedSpecie(item)}
                    sx={{
                      bgcolor: theme.palette.primary.contrastText,
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      height: '76px',
                      pl: 4,
                      cursor: 'pointer',
                      border: isSelected ? `1px solid ${theme.palette.primary.main}` : '0px'
                    }}
                  >
                    <SpeciesCard species={item} />
                    <Box
                      sx={{
                        bgcolor: theme.palette.customColors.Surface,
                        minWidth: '56px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderTopRightRadius: '8px',
                        borderBottomRightRadius: '8px'
                      }}
                    >
                      <Box
                        sx={{
                          height: '18px',
                          width: '18px',
                          padding: '3px',
                          borderRadius: '50%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: `1.5px solid ${
                            isSelected ? theme.palette.primary.main : theme.palette.customColors.neutralSecondary
                          }`
                        }}
                      >
                        {isSelected && (
                          <Box
                            sx={{
                              height: '10px',
                              width: '10px',
                              borderRadius: '50%',
                              border: `1.5px solid ${
                                isSelected ? theme.palette.primary.main : theme.palette.customColors.neutralSecondary
                              }`,
                              bgcolor: isSelected ? theme.palette.primary.main : 'transparent'
                            }}
                          ></Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )
              })}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Bottom Button */}
      <Box
        sx={{
          height: '106px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton
          disabled={!tempSelectedSpecie?.tsn_id}
          sx={{ height: '58px' }}
          fullWidth
          variant='contained'
          size='large'
          onClick={() => {
            setSelectedSpecie(tempSelectedSpecie)
            setOpenspeciesFilter(false)
            setTempSelectedSpecie(null)
          }}
        >
          DONE
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AssessmentSpeciesFilter
