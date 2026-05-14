import { useState, useEffect, useCallback, useRef, useContext, useLayoutEffect, useMemo } from 'react'
import { Drawer, IconButton, TextField, Typography, CircularProgress, Box, Checkbox } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { getTaxonomyListForReport } from 'src/lib/api/report'
import { AssessmentSpeciesListingDrawerProps, SpeciesItem } from 'src/types/report'

interface AuthContextType {
  userData: {
    user: { zoos: { zoo_id: number; sites: { site_id: string | number; site_name: string }[] }[] }
  } | null
}

function AssessmentSpeciesListingDrawer({
  selectedSpecies = [],
  setSelectedSpecies,
  openspeciesFilter,
  setOpenspeciesFilter,
  selectAllActive,
  setSelectAllActive,
  isSearchResult,
  setIsSearchResult
}: AssessmentSpeciesListingDrawerProps) {
  const theme = useTheme()
  const drawerContentRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  const authData = useContext(AuthContext) as AuthContextType
  const zoo_id = authData?.userData?.user?.zoos[0]?.zoo_id

  const [tempSelectedSpecies, setTempSelectedSpecies] = useState<SpeciesItem[]>(selectedSpecies || [])
  const [selectAllMode, setSelectAllMode] = useState(false)

  const [searchValue, setSearchValue] = useState('')
  const [speciesList, setSpeciesList] = useState<SpeciesItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const [footerH, setFooterH] = useState(0)

  // Use ref to track loading state for guard checks
  const loadingRef = useRef(false)

  const measureHeights = useCallback(() => {
    setFooterH(footerRef.current?.getBoundingClientRect().height ?? 0)
  }, [])

  useLayoutEffect(() => {
    measureHeights()
  }, [measureHeights])

  useEffect(() => {
    window.addEventListener('resize', measureHeights)

    return () => window.removeEventListener('resize', measureHeights)
  }, [measureHeights])

  useEffect(() => {
    setTempSelectedSpecies(selectedSpecies || [])
    setSelectAllMode(selectAllActive || false) // Initialize with parent's select all state
  }, [selectedSpecies, openspeciesFilter, selectAllActive])

  // When selectAllMode is active and species list updates, auto-select all loaded species
  // But ONLY if it's not a search result (for search results, we select specific IDs)
  useEffect(() => {
    if (selectAllMode && !isSearchResult && speciesList.length > 0) {
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
  }, [selectAllMode, isSearchResult, speciesList])

  const fetchSpecies = useCallback(async (q = '', pageNum = 1, isNewSearch = false) => {
    // Use ref to prevent concurrent requests
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)

    try {
      const res = await getTaxonomyListForReport({
        zoo_id,
        list_type: 'species',
        q,
        limit: 10,
        page_no: pageNum
      })

      const newSpecies: SpeciesItem[] = res?.data?.classification_list || []
      setSpeciesList(prev => (isNewSearch ? newSpecies : [...prev, ...newSpecies]))

      if (Number(newSpecies?.length) === 0) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
    } catch (err) {
      console.error('Failed to fetch taxonomy list:', err)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [zoo_id])

  useEffect(() => {
    fetchSpecies('', 1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(1)
        setSpeciesList([])
        setHasMore(true)
        setSelectAllMode(false) // Reset select all mode on new search
        // Reset isSearchResult in parent when search changes
        if (setIsSearchResult) {
          setIsSearchResult(false)
        }
        fetchSpecies(value, 1, true)
      }, 500),
    [fetchSpecies, setIsSearchResult]
  )

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleCloseDrawer = () => {
    setOpenspeciesFilter(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const toggleSpeciesSelection = useCallback(
    (specie: SpeciesItem) => {
      setTempSelectedSpecies(prev => {
        const exists = prev.some(selected => selected?.tsn_id === specie.tsn_id)
        if (exists) {
          // If deselecting, turn off select all mode
          setSelectAllMode(false)
          return prev.filter(selected => selected?.tsn_id !== specie.tsn_id)
        }
        return [...prev, specie]
      })
    },
    []
  )

  const handleSelectAll = useCallback(() => {
    const allSelected = speciesList.every(specie => selectedSpeciesIds.has(specie.tsn_id))

    if (allSelected) {
      // Deselect all species and turn off select all mode
      setSelectAllMode(false)
      // If this was a true "Select All" (not search result), clear everything
      // Otherwise, only deselect the currently visible species
      if (!isSearchResult) {
        setTempSelectedSpecies([])
      } else {
        const visibleTsnIds = new Set(speciesList.map(s => s.tsn_id))
        setTempSelectedSpecies(prev => prev.filter(selected => !visibleTsnIds.has(selected?.tsn_id)))
      }
    } else {
      // Select all currently visible species and activate select all mode
      setSelectAllMode(true)
      const newSelections = speciesList.filter(specie => !selectedSpeciesIds.has(specie.tsn_id))
      setTempSelectedSpecies(prev => [...prev, ...newSelections])
    }
  }, [speciesList, selectedSpeciesIds, isSearchResult])

  const handleScroll = useCallback(() => {
    if (!drawerContentRef.current || loading || !hasMore) return
    const { scrollTop, scrollHeight, clientHeight } = drawerContentRef.current
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchSpecies(searchValue, nextPage)
    }
  }, [loading, hasMore, page, searchValue, fetchSpecies])

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
          position: 'sticky',
          bottom: 0,
          minHeight: '106px',
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1
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
            // Pass whether this is a search result
            if (setIsSearchResult) {
              setIsSearchResult(searchValue.trim() !== '')
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
