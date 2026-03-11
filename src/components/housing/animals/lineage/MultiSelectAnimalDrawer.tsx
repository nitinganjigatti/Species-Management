import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Drawer, Typography, IconButton, CircularProgress, Button } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

import AnimalParentCard from 'src/views/utility/animalParentCard'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'

const PAGE_SIZE = 10

export interface Animal {
  animal_id?: number
  default_common_name?: string
  common_name?: string
  scientific_name?: string
  complete_name?: string
  vernacular_name?: string
  user_enclosure_name?: string
  enclosure_name?: string
  section_name?: string
  site_name?: string
  type?: string
  sex?: string
  gender?: string
  default_icon?: string
  image_url?: string
  total_animal?: number
  local_identifier_name?: string
  local_identifier_value?: string
  site_id?: number
  enclosure_id?: number
  taxonomy_id?: number
  breed_name?: string
  morph_name?: string
  is_alive?: string | number
  in_transit?: string
  is_hospitalized?: string
}

interface MultiSelectAnimalDrawerProps {
  open: boolean
  onClose: () => void
  onSelect: (animals: Animal[]) => void
  initialSelectedAnimals?: Animal[]
  title?: string
  btnText?: string
  searchPlaceholder?: string
  // Selection mode - 'single' for radio buttons, 'multi' for checkboxes
  selectionMode?: 'single' | 'multi'
  // Extra params to pass to API - parent component controls all filter params
  extraParams?: Record<string, any>
  // z-index for proper stacking with other drawers
  zIndex?: number
}

const MultiSelectAnimalDrawer: React.FC<MultiSelectAnimalDrawerProps> = ({
  open,
  onClose,
  onSelect,
  initialSelectedAnimals = [],
  title = 'Select Animals',
  btnText = 'SELECT',
  searchPlaceholder = 'Search animal by AID or identifier',
  selectionMode = 'multi',
  extraParams = {},
  zIndex
}) => {
  const theme = useTheme() as any
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [selectedAnimals, setSelectedAnimals] = useState<Animal[]>([])

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef(false)

  const debouncedSearch = useMemo(() => debounce((value: string) => setSearch(value), 500), [])

  const isSingleSelectMode = selectionMode === 'single'

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
      setSelectedAnimals(initialSelectedAnimals || [])
    }
  }, [open, initialSelectedAnimals])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Include extraParams in queryKey for proper cache invalidation
  const queryKey = ['multi-select-animal-drawer', search, JSON.stringify(extraParams), open]

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey,
    enabled: Boolean(open),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      // Default params: page_no, limit, search
      // All other params come from extraParams
      const params: Record<string, any> = {
        page_no: pageParam,
        limit: PAGE_SIZE,
        ...(search && { filter_aid_local_identifier: search }),
        ...extraParams
      }

      const res = await getNewAnimalListWithFilters(params)

      const resultData = res?.data || []
      const totalCount = res?.total_count || 0

      return {
        animals: resultData,
        nextPage: resultData.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total_animal_count: totalCount
      }
    },
    getNextPageParam: lastPage => lastPage?.nextPage,
    gcTime: 0,
    staleTime: 0
  })

  const clearQuery = useCallback(() => {
    queryClient.removeQueries({
      queryKey: ['multi-select-animal-drawer'],
      exact: false
    })
  }, [queryClient])

  // Cleanup when drawer closes
  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: ['multi-select-animal-drawer'] })
      clearQuery()
      cooldownRef.current = false
    }
  }, [open, queryClient, clearQuery])

  // Transform API response to consistent animal format
  const list = useMemo(
    () =>
      data?.pages?.flatMap(page =>
        page.animals.map((animal: any) => ({
          animal_id: animal?.animal_id,
          default_common_name: animal?.default_common_name || animal?.common_name,
          common_name: animal?.common_name,
          scientific_name: animal?.complete_name || animal?.scientific_name,
          complete_name: animal?.complete_name,
          vernacular_name: animal?.vernacular_name,
          user_enclosure_name: animal?.user_enclosure_name,
          enclosure_name: animal?.enclosure_name,
          section_name: animal?.section_name,
          site_name: animal?.site_name,
          type: animal?.type,
          sex: animal?.sex || animal?.gender,
          gender: animal?.gender || animal?.sex,
          default_icon: animal?.default_icon,
          image_url: animal?.image_url,
          total_animal: animal?.total_animal,
          local_identifier_name: animal?.local_identifier_name,
          local_identifier_value: animal?.local_identifier_value,
          site_id: animal?.site_id,
          enclosure_id: animal?.enclosure_id,
          taxonomy_id: animal?.taxonomy_id,
          breed_name: animal?.breed_name,
          morph_name: animal?.morph_name,
          is_alive: animal?.is_alive,
          in_transit: animal?.in_transit,
          is_hospitalized: animal?.is_hospitalized
        }))
      ) || [],
    [data]
  )

  // Infinite scroll load more
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

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    setSearch('')
  }

  // Selection handlers
  const handleAnimalClick = (animal: Animal) => {
    if (isSingleSelectMode) {
      // Single select: just set the animal (toggle off if same animal clicked)
      setSelectedAnimals(prev => {
        if (prev.length > 0 && prev[0].animal_id === animal.animal_id) {
          return []
        }

        return [animal]
      })
    } else {
      // Multi select: toggle in array
      setSelectedAnimals(prev => {
        const isSelected = prev.some(a => a.animal_id === animal.animal_id)
        if (isSelected) {
          return prev.filter(a => a.animal_id !== animal.animal_id)
        }

        return [...prev, animal]
      })
    }
  }

  // Submit selection
  const handleSubmit = () => {
    onSelect(selectedAnimals)
    onClose()
  }

  // Close and reset
  const handleClose = () => {
    setSelectedAnimals([])
    onClose()
  }

  // Button text with count (hide count in single select mode)
  const getButtonText = () => {
    if (!isSingleSelectMode && selectedAnimals.length > 1) {
      return `${btnText} (${selectedAnimals.length})`
    }

    return btnText
  }

  const hasValidSelection = selectedAnimals.length > 0

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      sx={{
        ...(zIndex && { zIndex }),
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors?.bodyBg || theme.palette.background.default
        }
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header */}
        <Box
          sx={{
            p: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme.palette.background.paper
          }}
        >
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 500,
              fontFamily: 'Inter',
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            {title}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ px: 4, pb: 4, background: theme.palette.background.paper }}>
          <Search
            width='100%'
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            inputStyle={{ py: '12px', px: '12px' }}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            py: 4,
            bgcolor: theme.palette.customColors?.bodyBg || theme.palette.background.default,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minHeight: 0,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            '-ms-overflow-style': 'none'
          }}
        >
          {isFetching && list.length === 0 ? (
            <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {list.map((animal: Animal) => {
                const isSelected = selectedAnimals.some(a => a.animal_id === animal.animal_id)
                const isDisabled = animal.in_transit === '1' || animal.is_hospitalized === '1'

                // When using radio/checkbox, the selection is handled by the onChange callback
                // We pass false for disabled animals so no radio/checkbox is rendered
                const selectionHandler = isDisabled
                  ? false
                  : {
                      checked: isSelected,
                      onChange: () => handleAnimalClick(animal)
                    }

                if (isSingleSelectMode) {
                  return (
                    <Box
                      key={animal.animal_id}
                      sx={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                    >
                      <AnimalParentCard data={animal} radio={selectionHandler} />
                    </Box>
                  )
                }

                return (
                  <Box
                    key={animal.animal_id}
                    sx={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                  >
                    <AnimalParentCard data={animal} checkbox={selectionHandler} />
                  </Box>
                )
              })}

              {list.length === 0 && !isFetching && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 200,
                    flexDirection: 'column'
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
                  No more animals to load
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Sticky Footer Button */}
      {hasValidSelection && (
        <Box
          sx={{
            width: '100%',
            p: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Button variant='contained' fullWidth color='primary' onClick={handleSubmit} sx={{ p: 3, fontWeight: 600 }}>
            {getButtonText()}
          </Button>
        </Box>
      )}
    </Drawer>
  )
}

export default MultiSelectAnimalDrawer
