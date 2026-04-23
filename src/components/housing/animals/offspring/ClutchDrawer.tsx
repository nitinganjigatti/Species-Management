import React, { useEffect, useState, useMemo, useCallback } from 'react'
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
  const [isAnimalFetching, setIsAnimalFetching] = useState<boolean>(false)
  const [animalData, setAnimalData] = useState<AnimalItem[] | null>(null)
  const [animalPage, setAnimalPage] = useState(1)
  const [animalHasMore, setAnimalHasMore] = useState(true)
  const [isFetchingMoreAnimals, setIsFetchingMoreAnimals] = useState(false)
  const [isEggFetching, setIsEggFetching] = useState<boolean>(false)
  const [eggData, setEggData] = useState<ClutchEgg[] | null>(null)
  const [eggPage, setEggPage] = useState(1)
  const [eggHasMore, setEggHasMore] = useState(true)
  const [isFetchingMoreEggs, setIsFetchingMoreEggs] = useState(false)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const debouncedSearchClutch = useMemo(() => debounce(setSearchClutch, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearchClutch.cancel()
    }
  }, [debouncedSearchClutch])

  const fetchClutchAnimalList = async (pageNo: number = 1) => {
    if (!clutchDetails?.clutch_id) return

    if (pageNo === 1) {
      setIsAnimalFetching(true)
      setAnimalHasMore(true)
    } else {
      setIsFetchingMoreAnimals(true)
    }

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

        if (result.length < 10) {
          setAnimalHasMore(false)
        }
      } else {
        if (pageNo === 1) {
          setAnimalData([])
        }
        setAnimalHasMore(false)
      }
    } catch (error: any) {
      console.error(error?.message)
      if (pageNo === 1) {
        setAnimalData([])
      }
      setAnimalHasMore(false)
    } finally {
      setIsAnimalFetching(false)
      setIsFetchingMoreAnimals(false)
    }
  }

  const fetchClutchEggList = async (pageNo: number = 1) => {
    if (!clutchDetails?.clutch_id) return

    if (pageNo === 1) {
      setIsEggFetching(true)
      setEggHasMore(true)
    } else {
      setIsFetchingMoreEggs(true)
    }

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
        const loadedCount = pageNo === 1 ? result.length : (eggData?.length || 0) + result.length

        if (pageNo === 1) {
          setEggData(result)
        } else {
          setEggData(prev => [...(prev || []), ...result])
        }

        if (loadedCount >= total) {
          setEggHasMore(false)
        }
      } else {
        if (pageNo === 1) {
          setEggData([])
        }
        setEggHasMore(false)
      }
    } catch (error: any) {
      console.error(error?.message)
      if (pageNo === 1) {
        setEggData([])
      }
      setEggHasMore(false)
    } finally {
      setIsEggFetching(false)
      setIsFetchingMoreEggs(false)
    }
  }

  const handleSearchClutch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearchClutch(value)
  }

  const handleSearchClutchClear = (): void => {
    setSearchInput('')
    setSearchClutch('')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const handleAnimalClick = (animalId: string) => {
    router.push(`/animals/${animalId}`)
  }

  useEffect(() => {
    if (!clutchDetails?.clutch_id) return

    if (activeTab === 'eggs') {
      setEggPage(1)
      setEggData([])
      setEggHasMore(true)
      fetchClutchEggList(1)
    } else {
      setAnimalPage(1)
      setAnimalData([])
      setAnimalHasMore(true)
      fetchClutchAnimalList(1)
    }
  }, [clutchDetails?.clutch_id, searchClutch, activeTab])

  const handleLoadMore = useCallback(() => {
    if (activeTab === 'eggs') {
      if (isEggFetching || isFetchingMoreEggs || !eggHasMore) return

      const nextPage = eggPage + 1
      setEggPage(nextPage)
      fetchClutchEggList(nextPage)

      return
    }

    if (isAnimalFetching || isFetchingMoreAnimals || !animalHasMore) return

    const nextPage = animalPage + 1
    setAnimalPage(nextPage)
    fetchClutchAnimalList(nextPage)
  }, [
    activeTab,
    eggPage,
    animalPage,
    eggHasMore,
    animalHasMore,
    isEggFetching,
    isAnimalFetching,
    isFetchingMoreEggs,
    isFetchingMoreAnimals,
    searchClutch,
    clutchDetails?.clutch_id
  ])

  useEffect(() => {
    if (!inView) return

    if (activeTab === 'eggs' && eggData?.length) {
      handleLoadMore()
    }

    if (activeTab === 'animals' && animalData?.length) {
      handleLoadMore()
    }
  }, [inView, activeTab, eggData?.length, animalData?.length, handleLoadMore])

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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
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
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              backgroundColor: theme.palette.background.default
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                px: 4
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: theme.palette.background.default,
                  flexGrow: 1
                }}
              >
                {activeTab === 'eggs' ? (
                  isEggFetching ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : eggData?.length === 0 || eggData === undefined ? (
                    <NoDataFound width={250} height={250} />
                  ) : (
                    <>
                      {eggData?.map(item => (
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
                      {(eggHasMore || isFetchingMoreEggs) && (
                        <Box
                          ref={loaderRef}
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            py: 4
                          }}
                        >
                          {isFetchingMoreEggs && <CircularProgress size={24} />}
                        </Box>
                      )}
                    </>
                  )
                ) : isAnimalFetching ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : animalData?.length === 0 ? (
                  <NoDataFound width={250} height={250} />
                ) : (
                  <>
                    {animalData?.map((item: AnimalItem, index: number) => (
                      <Box
                        key={item?.animal_id || index}
                        sx={{
                          p: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: theme.palette.customColors.OnPrimary,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.action.hover, 0.04)
                          },
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
                    {(animalHasMore || isFetchingMoreAnimals) && (
                      <Box
                        ref={loaderRef}
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          py: 4
                        }}
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
