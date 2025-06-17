import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Typography, Box, CircularProgress, Divider, Button, Drawer, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'

import Search from 'src/views/utility/Search'
import { getAllSpeciesList } from 'src/lib/api/housing'
import CloseIcon from '@mui/icons-material/Close'
import { CellInfo } from 'src/utility/render'
import SelectableSpeciesCard from '../SelectableSpeciesCard' // New reusable component

const PAGE_SIZE = 10

const SpeciesDrawer = ({ open, onClose, data, onSelect, selectedSpecies = [], title = 'Select Species' }) => {
  const theme = useTheme()
  const queryClient = useQueryClient()

  const [localSearch, setLocalSearch] = useState('')
  const [search, setSearch] = useState('')

  const [prevSelectedItems, setPrevSelectedItems] = useState([])
  const [newlySelectedItems, setNewlySelectedItems] = useState([])

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])

  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: [data?.queryKey, data?.id, search, open],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getAllSpeciesList({
        site_id: 16, // Temporary hardcoded
        ...data?.params,
        page_no: pageParam,
        limit: PAGE_SIZE,
        search
      })

      return {
        result: res?.data?.listing || [],
        nextPage: res?.data?.listing?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total: res?.data?.total_scies_count || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage,
    enabled: Boolean(open && data?.id && data?.queryKey)
  })

  const cooldownRef = useRef(false)

  const loadMore = useCallback(() => {
    if (cooldownRef.current || isFetchingNextPage || !hasNextPage) return
    cooldownRef.current = true
    fetchNextPage().finally(() => setTimeout(() => (cooldownRef.current = false), 300))
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
      setPrevSelectedItems(selectedSpecies)
      setNewlySelectedItems([])
    }
  }, [open, data?.id, selectedSpecies])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: [data?.queryKey, data?.id, search] })
      cooldownRef.current = false
    }
  }, [open, data?.id, search, queryClient])

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleToggle = speciesItem => {
    console.log("speciesItem",speciesItem)
    const isSelected = newlySelectedItems.some(item => item.tsn_id === speciesItem.tsn_id)

    const updated = isSelected
      ? newlySelectedItems.filter(item => item.tsn_id !== speciesItem.tsn_id)
      : [...newlySelectedItems, speciesItem]

    setNewlySelectedItems(updated)
  }

  const handleDone = () => {
    const combined = [...prevSelectedItems, ...newlySelectedItems]
    onSelect(combined)
    onClose()
  }

  const total = useMemo(() => queryData?.pages?.[0]?.total || 0, [queryData])

  // 🔍 Filter out previously selected species
  const list = useMemo(() => {
    const all = queryData?.pages?.flatMap(page => page?.result) || []
    
return all.filter(species => !prevSelectedItems.some(item => item.tsn_id === species.tsn_id))
  }, [queryData, prevSelectedItems])

  return (
    <Drawer open={open} onClose={onClose} anchor='right'>
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Box component='img' src='/images/housing/Enclosure icon.png' alt='icon' sx={{ width: 32, height: 32 }} />
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Scrollable content */}
        <Box sx={{ px: 5, flex: 1, overflowY: 'auto' }}>
          {data?.name && (
            <Box
              sx={{
                my: 4,
                p: 3,
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.common.white,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <CellInfo
                value={data?.name}
                imgUrl={data?.image}
                color={theme.palette.customColors.OnSurfaceVariant}
                subtitleColor={theme.palette.customColors.secondaryBg}
              />
            </Box>
          )}

          <Search
            sx={{ width: '100%' }}
            textFielsSX={{
              width: '100%',
              height: 52,
              borderRadius: '8px',
              backgroundColor: theme.palette.common.white
            }}
            placeholder='Search for species'
            value={localSearch}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            backgroundColor={theme.palette.common.white}
          />

          <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, my: 4 }}>
            Species {total ? `(${total})` : ''}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2 }}>
            {list.map(species => {
              const isSelected = newlySelectedItems.some(item => item.tsn_id === species.tsn_id)

              return (
                <SelectableSpeciesCard
                  key={species.tsn_id}
                  species={species}
                  selected={isSelected}
                  onClick={() => handleToggle(species)}
                  selectionType='checkbox'
                />
              )
            })}

            {isFetching && list.length === 0 && (
              <Box display='flex' justifyContent='center' py={2}>
                <CircularProgress />
              </Box>
            )}

            {(isFetchingNextPage || hasNextPage) && list.length > 0 && (
              <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                <CircularProgress />
              </Box>
            )}

            {!isFetching && list.length === 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.secondary }}>
                No species found
              </Typography>
            )}

            {!hasNextPage && list.length > 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                No more species to load
              </Typography>
            )}
          </Box>
        </Box>

        {/* Sticky footer */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            px: 5,
            py: 4,
            backgroundColor: theme.palette.common.white,
            boxShadow: `0px -4px 21px 0px ${
              theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'
            }`,
            zIndex: 1
          }}
        >
          <Button
            fullWidth
            variant='contained'
            onClick={handleDone}
            disabled={newlySelectedItems.length === 0}
          >
            Done ({newlySelectedItems.length})
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(SpeciesDrawer)
