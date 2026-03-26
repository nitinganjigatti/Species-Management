import React, { useState, useEffect, useCallback, useRef, useContext, useLayoutEffect, useMemo } from 'react'
import { Drawer, IconButton, TextField, Typography, CircularProgress, Box, Checkbox } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { getTaxonomyListForReport } from 'src/lib/api/report'

function AssessmentSpeciesListingDrawer({
  selectedSpecies = [],
  setSelectedSpecies,
  openspeciesFilter,
  setOpenspeciesFilter,
  selectAllActive,
  setSelectAllActive
}) {
  const theme = useTheme()
  const drawerContentRef = useRef(null)
  const searchInputRef = useRef(null)
  const footerRef = useRef(null)

  const authData = useContext(AuthContext)
  const zoo_id = authData.userData.user.zoos[0]?.zoo_id

  const [tempSelectedSpecies, setTempSelectedSpecies] = useState(selectedSpecies || [])
  const [selectAllMode, setSelectAllMode] = useState(false)

  const [searchValue, setSearchValue] = useState('')
  const [speciesList, setSpeciesList] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const [footerH, setFooterH] = useState(0)

  const measureHeights = () => {
    setFooterH(footerRef.current?.getBoundingClientRect().height ?? 0)
  }

  useLayoutEffect(() => {
    measureHeights()
  }, [])

  useEffect(() => {
    window.addEventListener('resize', measureHeights)

    return () => window.removeEventListener('resize', measureHeights)
  }, [])

  useEffect(() => {
    setTempSelectedSpecies(selectedSpecies || [])
    setSelectAllMode(selectAllActive || false) // Initialize with parent's select all state
  }, [selectedSpecies, openspeciesFilter, selectAllActive])

  // When selectAllMode is active and species list updates, auto-select all loaded species
  useEffect(() => {
    if (selectAllMode && speciesList.length > 0) {
      setTempSelectedSpecies(prev => {
        const existingIds = new Set(prev.map(s => s.tsn_id))
        const newSelections = speciesList.filter(specie => !existingIds.has(specie.tsn_id))
        // Only update if there are new selections to add
        if (newSelections.length > 0) {
          return [...prev, ...newSelections]
        }
        return prev
      })
    }
  }, [selectAllMode, speciesList])

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
      setSpeciesList(prev => (isNewSearch ? newSpecies : [...prev, ...newSpecies]))

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
    fetchSpecies('', 1, true)
  }, [])

  const debouncedSearch = useCallback(
    debounce(value => {
      setPage(1)
      setSpeciesList([])
      setHasMore(true)
      setSelectAllMode(false) // Reset select all mode on new search
      fetchSpecies(value, 1, true)
    }, 500),
    [selectAllMode]
  )

  const handleCloseDrawer = () => {
    setOpenspeciesFilter(false)
  }

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  // Memoize selected species IDs for O(1) lookup performance
  const selectedSpeciesIds = useMemo(
    () => new Set(tempSelectedSpecies.map(s => s?.tsn_id)),
    [tempSelectedSpecies]
  )

  const areAllSelected = useMemo(
    () => speciesList.length > 0 && speciesList.every(specie => selectedSpeciesIds.has(specie.tsn_id)),
    [speciesList, selectedSpeciesIds]
  )

  const toggleSpeciesSelection = specie => {
    setTempSelectedSpecies(prev => {
      const exists = prev.some(selected => selected?.tsn_id === specie.tsn_id)
      if (exists) {
        // If deselecting, turn off select all mode
        setSelectAllMode(false)
        return prev.filter(selected => selected?.tsn_id !== specie.tsn_id)
      }
      return [...prev, specie]
    })
  }

  const handleSelectAll = useCallback(() => {
    const allSelected = speciesList.every(specie => selectedSpeciesIds.has(specie.tsn_id))

    if (allSelected) {
      // Deselect all currently visible species and turn off select all mode
      setSelectAllMode(false)
      const visibleTsnIds = new Set(speciesList.map(s => s.tsn_id))
      setTempSelectedSpecies(prev => prev.filter(selected => !visibleTsnIds.has(selected?.tsn_id)))
    } else {
      // Select all currently visible species and activate select all mode
      setSelectAllMode(true)
      const newSelections = speciesList.filter(specie => !selectedSpeciesIds.has(specie.tsn_id))
      setTempSelectedSpecies(prev => [...prev, ...newSelections])
    }
  }, [speciesList, selectedSpeciesIds])

  const handleScroll = () => {
    if (!drawerContentRef.current || loading || !hasMore) return
    const { scrollTop, scrollHeight, clientHeight } = drawerContentRef.current
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchSpecies(searchValue, nextPage)
    }
  }

  useEffect(() => {
    if (openspeciesFilter) {
      const timeout = setTimeout(() => {
        requestAnimationFrame(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus()
          }
        })
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [openspeciesFilter])

  return (
    <Drawer
      anchor='right'
      open={openspeciesFilter}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default'
        }
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

      {/* Search */}
      <Box sx={{ px: 4, backgroundColor: 'background.default' }}>
        <TextField
          fullWidth
          value={searchValue}
          onChange={handleSearchChange}
          placeholder='Search by species name or scientific name'
          inputProps={{ ref: searchInputRef }}
          sx={{
            bgcolor: theme.palette.primary.contrastText,
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            borderRadius: '8px',
            '& .MuiOutlinedInput-root': {
              border: 'none',
              '& fieldset': { border: 'none' }
            },
            '& .MuiInputBase-input::placeholder': {
              color: theme.palette.customColors.OutlineVariant,
              fontSize: '14px',
              fontWeight: '400'
            }
          }}
        />
      </Box>

      {/* Species Header with Select All */}
      <Box
        sx={{
          mt: 6,
          mb: 4,
          px: 4,
          backgroundColor: 'background.default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Species
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            pr: theme => theme.spacing(3.255),
            mr: -4
          }}
        >
          <Box
            onClick={handleSelectAll}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.primary.main,
                mr: 1
              }}
            >
              Select All
            </Typography>
            <Checkbox checked={areAllSelected} color='primary' sx={{ p: 0 }} />
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box
        ref={drawerContentRef}
        onScroll={handleScroll}
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          pb: `calc(${footerH}px + env(safe-area-inset-bottom, 0px) + 16px)`,
          backgroundColor: 'background.default',
          p: theme => theme.spacing(1, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {speciesList.length > 0 &&
            speciesList.map((item, index) => {
              const isSelected = selectedSpeciesIds.has(item.tsn_id)
              return (
                <Box
                  key={item.tsn_id || index}
                  onClick={() => toggleSpeciesSelection(item)}
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
                    <Checkbox
                      checked={isSelected}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleSpeciesSelection(item)}
                      color='primary'
                    />
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

      {/* Bottom Button */}
      <Box
        ref={footerRef}
        sx={{
          position: 'sticky', // sticky works inside the Drawer column; avoids layout jumps
          bottom: 0,
          minHeight: '106px',

          // height: { xs: 88, sm: 96, md: 106 }, // responsive heights
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1

          // minHeight: '106px',
          // position: 'sticky',
          // bottom: 0,
          // // height: { xs: 88, sm: 96, md: 106 },
          // px: 4,
          // bgcolor: 'white',
          // alignItems: 'center',
          // justifyContent: 'center',
          // gap: 5,
          // display: 'flex',
          // boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          // zIndex: 1
        }}
      >
        <LoadingButton
          disabled={loading}
          sx={{ height: '58px', width: '100%' }}
          variant='contained'
          size='large'
          onClick={() => {
            setSelectedSpecies(tempSelectedSpecies)
            // Pass the select all mode state to parent component
            if (setSelectAllActive) {
              setSelectAllActive(selectAllMode)
            }
            setOpenspeciesFilter(false)
          }}
        >
          DONE
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AssessmentSpeciesListingDrawer
