import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Box, Drawer, IconButton, Typography, useTheme, CircularProgress, Tabs, Tab } from '@mui/material'
import { alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import useSafeRouter from 'src/hooks/useSafeRouter'
import AnimalCard from 'src/views/utility/AnimalCard'

import { getClutchEggList } from 'src/lib/api/housing'
import NoDataFound from 'src/views/utility/NoDataFound'
import Search from 'src/views/utility/Search'
import debounce from 'lodash/debounce'
import { useTranslation } from 'react-i18next'
import { AnimalItem, ClutchItem, ClutchEgg } from 'src/types/housing/animalsOffspring'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'
import EggCard from './EggCard'
import { useInView } from 'react-intersection-observer'
import ClutchView from './ClutchView'

interface ClutchDrawerProps {
  open: boolean
  onClose: () => void
  clutchDetails: ClutchItem | null
}

const ClutchDrawer = ({ open, onClose, clutchDetails }: ClutchDrawerProps) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const router = useSafeRouter()
  const { id } = router.query as { id: string }

  const [searchInput, setSearchInput] = useState('')
  const [searchClutch, setSearchClutch] = useState('')
  const [activeTab, setActiveTab] = useState('eggs')

  // --- Egg state ---
  const [isEggFetching, setIsEggFetching] = useState<boolean>(false)
  const [eggData, setEggData] = useState<ClutchEgg[] | null>(null)
  const [eggHasMore, setEggHasMore] = useState(true)
  const [isFetchingMoreEggs, setIsFetchingMoreEggs] = useState(false)

  // --- Animal state ---
  const [isAnimalFetching, setIsAnimalFetching] = useState<boolean>(false)
  const [animalData, setAnimalData] = useState<AnimalItem[] | null>(null)
  const [animalHasMore, setAnimalHasMore] = useState(true)
  const [isFetchingMoreAnimals, setIsFetchingMoreAnimals] = useState(false)

  // FIX 1: Separate refs for each tab's infinite scroll loader
  const { ref: eggLoaderRef, inView: eggInView } = useInView({ threshold: 0 })
  const { ref: animalLoaderRef, inView: animalInView } = useInView({ threshold: 0 })

  // FIX 2: Use refs for page numbers so closures always read the latest value
  const eggPageRef = useRef(1)
  const animalPageRef = useRef(1)

  // FIX 3: Ref-based in-flight guard to prevent concurrent/duplicate fetches
  const isEggLoadingRef = useRef(false)
  const isAnimalLoadingRef = useRef(false)

  // FIX 4: Track total loaded count in a ref to avoid stale closure in hasMore check
  const eggLoadedCountRef = useRef(0)

  const debouncedSearchClutch = useRef(debounce((val: string) => setSearchClutch(val), 500)).current

  useEffect(() => {
    return () => {
      debouncedSearchClutch.cancel()
    }
  }, [debouncedSearchClutch])

  // ─── Fetch functions ───────────────────────────────────────────────────────

  const fetchClutchEggList = useCallback(
    async (pageNo: number = 1) => {
      if (!clutchDetails?.clutch_id) return
      if (isEggLoadingRef.current) return // FIX 3: block re-entrant calls

      if (pageNo === 1) {
        setIsEggFetching(true)
        setEggHasMore(true)
        eggLoadedCountRef.current = 0 // reset count on fresh fetch
      } else {
        setIsFetchingMoreEggs(true)
      }

      isEggLoadingRef.current = true

      try {
        const response = await getClutchEggList({
          type: 'offspring',
          q: searchClutch,
          parent_id: id,
          is_mother: 1,
          clutch_id: clutchDetails?.clutch_id,
          page_no: pageNo
        })

        if (response?.success) {
          const result = (response?.data?.result || []) as ClutchEgg[]
          const total = Number(response?.data?.total_count || 0)

          if (pageNo === 1) {
            eggLoadedCountRef.current = result.length
            setEggData(result)
          } else {
            eggLoadedCountRef.current += result.length
            setEggData(prev => [...(prev || []), ...result])
          }

          // FIX 4: use ref-tracked count, not stale eggData?.length from closure
          if (eggLoadedCountRef.current >= total) {
            setEggHasMore(false)
          }
        } else {
          if (pageNo === 1) setEggData([])
          setEggHasMore(false)
        }
      } catch (error: any) {
        console.error(error?.message)
        if (pageNo === 1) setEggData([])
        setEggHasMore(false)
      } finally {
        setIsEggFetching(false)
        setIsFetchingMoreEggs(false)
        isEggLoadingRef.current = false // FIX 3: release guard
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clutchDetails?.clutch_id, searchClutch, id]
  )

  const fetchClutchAnimalList = useCallback(
    async (pageNo: number = 1) => {
      if (!clutchDetails?.clutch_id) return
      if (isAnimalLoadingRef.current) return // FIX 3: block re-entrant calls

      if (pageNo === 1) {
        setIsAnimalFetching(true)
        setAnimalHasMore(true)
      } else {
        setIsFetchingMoreAnimals(true)
      }

      isAnimalLoadingRef.current = true

      try {
        const response = await getNewAnimalListWithFilters({
          q: searchClutch,
          clutch_id: clutchDetails?.clutch_id,
          ignore_permission: 1,
          include_dead_animal: 1,
          page_no: pageNo
        })

        if (response?.success) {
          const result = (response.data || []) as AnimalItem[]

          if (pageNo === 1) {
            setAnimalData(result)
          } else {
            setAnimalData(prev => [...(prev || []), ...result])
          }

          if (result.length < 10) setAnimalHasMore(false)
        } else {
          if (pageNo === 1) setAnimalData([])
          setAnimalHasMore(false)
        }
      } catch (error: any) {
        console.error(error?.message)
        if (pageNo === 1) setAnimalData([])
        setAnimalHasMore(false)
      } finally {
        setIsAnimalFetching(false)
        setIsFetchingMoreAnimals(false)
        isAnimalLoadingRef.current = false // FIX 3: release guard
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clutchDetails?.clutch_id, searchClutch]
  )

  // ─── Initial / search / tab change fetch ──────────────────────────────────

  useEffect(() => {
    if (!clutchDetails?.clutch_id) return

    if (activeTab === 'eggs') {
      eggPageRef.current = 1
      eggLoadedCountRef.current = 0
      setEggData([])
      setEggHasMore(true)
      fetchClutchEggList(1)
    } else {
      animalPageRef.current = 1
      setAnimalData([])
      setAnimalHasMore(true)
      fetchClutchAnimalList(1)
    }
  }, [clutchDetails?.clutch_id, searchClutch, activeTab, fetchClutchEggList, fetchClutchAnimalList])

  // ─── FIX 2: Separate inView effects, no handleLoadMore in deps ───────────

  useEffect(() => {
    if (!eggInView) return
    if (activeTab !== 'eggs') return
    if (isEggLoadingRef.current || !eggHasMore || !eggData?.length) return

    const nextPage = eggPageRef.current + 1
    eggPageRef.current = nextPage
    fetchClutchEggList(nextPage)
  }, [eggInView]) // deliberately minimal deps — guard refs handle concurrency

  useEffect(() => {
    if (!animalInView) return
    if (activeTab !== 'animals') return
    if (isAnimalLoadingRef.current || !animalHasMore || !animalData?.length) return

    const nextPage = animalPageRef.current + 1
    animalPageRef.current = nextPage
    fetchClutchAnimalList(nextPage)
  }, [animalInView]) // deliberately minimal deps — guard refs handle concurrency

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSearchClutch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearchClutch(value)
  }

  const handleSearchClutchClear = (): void => {
    setSearchInput('')
    setSearchClutch('')
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const handleAnimalClick = (animalId: string) => {
    router.push(`/animals/${animalId}`)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 560 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.background.default,
              p: 0,
              height: '100%'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 4,
              backgroundColor: theme.palette.customColors.OnPrimary,
              zIndex: 10
            }}
          >
            <Typography
              sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
            >
              {t('animals_module.clutch_details')}
            </Typography>
            <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>

          <ClutchView clutchDetails={clutchDetails} titleKey='animals_module.clutch' sx={{ my: 4, mx: 4 }} />

          {/* Tabs */}
          <Box>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='fullWidth'
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.customColors.OnPrimary,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '14px'
                }
              }}
            >
              <Tab value='eggs' label={t('animals_module.eggs')} />
              <Tab value='animals' label={t('animals')} />
            </Tabs>
          </Box>

          {/* Search */}
          <Box sx={{ backgroundColor: theme.palette.background.default, py: 4, px: 4 }}>
            <Box sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 1 }}>
              <Search
                width={'100%'}
                placeholder={t('search') as string}
                value={searchInput}
                onChange={handleSearchClutch}
                onClear={handleSearchClutchClear}
                inputStyle={{ py: '16px', px: '12px' }}
              />
            </Box>
          </Box>

          {/* Scrollable list */}
          <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, backgroundColor: theme.palette.background.default }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, px: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: theme.palette.background.default,
                  flexGrow: 1
                }}
              >
                {/* ── Eggs tab ── */}
                {activeTab === 'eggs' ? (
                  isEggFetching ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : !eggData?.length ? (
                    <NoDataFound width={250} height={250} />
                  ) : (
                    <>
                      {eggData.map(item => (
                        <EggCard
                          key={item.egg_id}
                          imgURl={item.default_icon}
                          defaultName={item.default_common_name}
                          completeName={item.complete_name}
                          eggCode={item.egg_code}
                          eggCondition={item.egg_condition}
                          egg_status={item.egg_status}
                          egg_state={item.egg_state}
                          batch={item.discard_request_id}
                          date={item.collection_date}
                          status={item.discard_activity_status}
                        />
                      ))}

                      {/* FIX 1: egg-specific loader ref */}
                      {(eggHasMore || isFetchingMoreEggs) && (
                        <Box
                          ref={eggLoaderRef}
                          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}
                        >
                          {isFetchingMoreEggs && <CircularProgress size={24} />}
                        </Box>
                      )}
                    </>
                  )
                ) : /* ── Animals tab ── */
                isAnimalFetching ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : !animalData?.length ? (
                  <NoDataFound width={250} height={250} />
                ) : (
                  <>
                    {animalData.map((item: AnimalItem, index: number) => (
                      <Box
                        key={item?.animal_id || index}
                        sx={{
                          p: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: theme.palette.customColors.OnPrimary,
                          '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.04) },
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          mb: 2,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleAnimalClick(String(item.animal_id))}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <AnimalCard data={item} />
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.palette.customColors.OnSurfaceVariant,
                            ml: 4
                          }}
                        >
                          <Icon icon={'fe:arrow-right'} fontSize={24} />
                        </Box>
                      </Box>
                    ))}

                    {/* FIX 1: animal-specific loader ref */}
                    {(animalHasMore || isFetchingMoreAnimals) && (
                      <Box
                        ref={animalLoaderRef}
                        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}
                      >
                        {isFetchingMoreAnimals && <CircularProgress size={24} />}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default React.memo(ClutchDrawer)