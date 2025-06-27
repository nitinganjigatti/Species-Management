import React, { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { Drawer, IconButton, TextField, Typography, CircularProgress } from '@mui/material'
import { Box } from '@mui/system'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { getTaxonomyListForReport } from 'src/lib/api/report'

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

      setSpeciesList(prev => (isNewSearch ? newSpecies : [...prev, ...newSpecies]))
      // setTotalCount(speciesList?.length)

      // if ((isNewSearch ? newSpecies.length : speciesList.length + newSpecies.length) >= total) {
      if (Number(newSpecies?.length) === 0) {
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
    setTotalCount(speciesList?.length)
  }, [speciesList])

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
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: '24px'
        }}
      >
        <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Select Species</Typography>
        <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>
      <Box sx={{ px: 4, backgroundColor: 'background.default' }}>
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

        <Typography
          sx={{
            mt: 6,
            mb: 4,
            fontSize: '16px',
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant,
            letterSpacing: 0,
            lineHeight: '100%'
          }}
        >
          Species{totalCount > 0 && ` (${totalCount})`}
        </Typography>
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
        <Box sx={{ bgcolor: 'background.default', p: theme => theme.spacing(1, 3.255, 3, 5.255) }}>
          <Box sx={{ pb: 25, display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            // setTempSelectedSpecie(null)
          }}
        >
          DONE
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AssessmentSpeciesFilter
