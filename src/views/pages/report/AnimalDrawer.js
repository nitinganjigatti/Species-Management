import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Drawer, Typography, IconButton, CircularProgress, Button } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import Search from 'src/views/utility/Search'
import { FilterButton } from 'src/views/utility/render-snippets'
import { Grid } from '@mui/system'
import { debounce } from 'lodash'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getAnimalListForObservationReport } from 'src/lib/api/compliance/reports'
import NoDataFound from 'src/views/utility/NoDataFound'

const horizontalNav = [
  { label: 'All', value: 'all' },
  { label: 'Recently Added', value: 'recentlyAdded' },
  { label: 'Under Treatment', value: 'underTreatment' },
  { label: 'Recently Transported', value: 'recentlyTransported' }
]

const PAGE_SIZE = 10

const AnimalDrawer = ({ open, onClose, selectedAnimal, setSelectedAnimal }) => {
  const theme = useTheme()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [internalSelected, setInternalSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  function formatDate(date) {
    return date ? date.toISOString().split('T')[0] : undefined
  }

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, remove } = useInfiniteQuery({
    queryKey: ['animal-List-Observation-Report', search],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search,
        type: 'all_animals',
        end_date: formatDate(new Date())
      }
      const res = await getAnimalListForObservationReport(params)

      return {
        animals: res?.data?.animals || [],
        nextPage: res?.data?.animals?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total_animal_count: res?.data?.total_animal_count || 0
      }
    },
    getNextPageParam: lastPage => lastPage.nextPage
  })

  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries(['animal-List-Observation-Report', search])
      remove()
      cooldownRef.current = false
    }
  }, [open, search, queryClient, remove])

  const list = useMemo(() => data?.pages?.flatMap(page => page.animals) || [], [data])
  const total = useMemo(() => data?.pages?.[0]?.total_animal_count || 0, [data])

  const cooldownRef = useRef(false)

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

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleTabClick = tabValue => {
    setActiveTab(tabValue)
    setSearch('')
  }

  const onGenerateClick = () => {
    setSelectedAnimal(internalSelected)
    onClose()
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors.bodyBg
        }
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}>
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 500,
              fontFamily: 'Inter',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Select the Animal
          </Typography>
          <IconButton
            onClick={() => {
              setSelectedAnimal(null)
              setInternalSelected(null)
              onClose()
            }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        <Grid
          container
          spacing={2}
          alignItems='center'
          sx={{
            px: 4,
            background: '#FFF',
            pt: 0,
            pb: 4
          }}
        >
          <Grid item size={{ xs: 12, sm: 10.5 }}>
            <Search
              width='100%'
              placeholder='Search by Animal name, AID or Identifier'
              value={localSearch}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
            />
          </Grid>
          <Grid
            item
            size={{ xs: 12, sm: 1.5 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-end', sm: 'center' },
              mt: { xs: 2, sm: 0 }
            }}
          >
            <FilterButton />
          </Grid>
        </Grid>

        <Box
          sx={{
            background: theme.palette.customColors.bodyBg,
            px: 4,
            py: 3
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              '-ms-overflow-style': 'none',
              pb: 1
            }}
          >
            {horizontalNav.map(item => (
              <Button
                key={item.value}
                onClick={() => handleTabClick(item.value)}
                sx={{
                  textTransform: 'none',
                  borderRadius: '2',
                  px: 3,
                  py: 1.5,
                  fontWeight: 500,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  flexShrink: 0,
                  border: 'none',
                  backgroundColor: activeTab === item.value ? '#1F515B' : '#0000000D',
                  color: activeTab === item.value ? '#FFFFFF' : '#666666'
                }}
              >
                {item.label} {typeof item.count === 'number' ? ` (${item.count})` : ''}
              </Button>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            bgcolor: theme.palette.customColors.bodyBg,
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
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
              {list.map(animal => (
                <AnimalParentCard
                  key={animal.animal_id}
                  data={animal}
                  radio={{
                    checked: internalSelected?.animal_id === animal.animal_id,
                    onChange: () => setInternalSelected(animal)
                  }}
                />
              ))}
              {list.length === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 200,
                    flexDirection: 'column',
                    p: 4,
                    mt: 6
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
                  No more species to load
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      {internalSelected !== null && (
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
          <Button
            variant='contained'
            fullWidth
            color='primary'
            onClick={onGenerateClick}
            sx={{ p: 3, fontWeight: 600 }}
          >
            GENERATE OBSERVATION REPORT
          </Button>
        </Box>
      )}
    </Drawer>
  )
}

export default AnimalDrawer
