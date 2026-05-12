import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Drawer, Typography, IconButton, CircularProgress, Button, Skeleton, Avatar } from '@mui/material'
import Icon from 'src/@core/components/icon'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import Search from 'src/views/utility/Search'
import { debounce } from 'lodash'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getAnimalFilterList, getAnimalListForObservationReport } from 'src/lib/api/compliance/reports'
import NoDataFound from 'src/views/utility/NoDataFound'
import AnimalFilterDrawer from './AnimalFilterDrawer'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 10

interface AnimalItem {
  animal_id: string | number
  default_common_name: string
  scientific_name: string
  user_enclosure_name: string
  section_name: string
  site_name: string
  type: string
  sex: string
  default_icon: string
  total_animal: number
  local_identifier_name: string
  local_identifier_value: string
  site_id: string | number
  enclosure_id: string | number
}

interface HorizontalNavItem {
  type: string
  label: string
}

interface FilterValues {
  Organizations: string[]
  'Site, Sec or Encl.': string[]
  Species: string[]
  Gender: string[]
  Age: string[]
  Mortality: string[]
}

interface FilterParams {
  organization_ids?: string
  site_ids?: string
  section_ids?: string
  enclosure_ids?: string
  species_ids?: string
  genders?: string
  age_groups?: string
  mortality_reasons?: string
}

interface AnimalDrawerProps {
  open: boolean
  onClose: () => void
  handleAnimalClick: (animal: AnimalItem | null) => void
  btnText?: string
  showAnimalFilter?: boolean
}

const EMPTY_FILTERS: FilterValues = {
  Organizations: [],
  'Site, Sec or Encl.': [],
  Species: [],
  Gender: [],
  Age: [],
  Mortality: []
}

const buildFilterParams = (filters: FilterValues | null): FilterParams => {
  if (!filters) return {}

  const params: FilterParams = {}

  const organizationIds = filters['Organizations']?.filter(Boolean) || []
  if (organizationIds.length) params.organization_ids = organizationIds.map(String).join(',')

  const locations = filters['Site, Sec or Encl.'] || []
  const siteIds: string[] = []
  const sectionIds: string[] = []
  const enclosureIds: string[] = []

  locations.forEach(value => {
    if (typeof value !== 'string') return
    const [type, id] = value.split(':')
    if (!id) return

    if (type === 'site') siteIds.push(id)
    else if (type === 'section') sectionIds.push(id)
    else if (type === 'enclosure') enclosureIds.push(id)
  })

  if (siteIds.length) params.site_ids = siteIds.join(',')
  if (sectionIds.length) params.section_ids = sectionIds.join(',')
  if (enclosureIds.length) params.enclosure_ids = enclosureIds.join(',')

  const speciesIds = filters['Species']?.filter(Boolean) || []
  if (speciesIds.length) params.species_ids = speciesIds.map(String).join(',')

  const genders = filters['Gender']?.filter(Boolean) || []
  if (genders.length) params.genders = genders.join(',')

  const ageGroups = filters['Age']?.filter(Boolean) || []
  if (ageGroups.length) params.age_groups = ageGroups.join(',')

  const mortalityReasons = filters['Mortality']?.filter(Boolean) || []
  if (mortalityReasons.length) params.mortality_reasons = mortalityReasons.map(String).join(',')

  return params
}

const AnimalDrawer = ({ open, onClose, handleAnimalClick, btnText, showAnimalFilter = true }: AnimalDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState<string>('')
  const [localSearch, setLocalSearch] = useState<string>('')
  const [internalSelected, setInternalSelected] = useState<AnimalItem | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all_animals')
  const [horizontalLoading, setHorizontalLoading] = useState<boolean>(true)
  const [horizontalNavList, setHorizontalNavList] = useState<HorizontalNavItem[]>([])
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false)
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(() => ({ ...EMPTY_FILTERS }))
  const [filterCount, setFilterCount] = useState<number>(0)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  const filterParams = useMemo(() => buildFilterParams(appliedFilters), [appliedFilters])
  const filtersKey = useMemo(() => JSON.stringify(filterParams), [filterParams])

  useEffect(() => {
    const getAnimalsHorizontalNavigation = async () => {
      try {
        const params = {}
        const response = await getAnimalFilterList({ params })
        if (response?.success) {
          setHorizontalNavList(response?.data as HorizontalNavItem[])
          setHorizontalLoading(false)
        }
      } catch (error) {
        console.log('Error getting horizontal navigation list')
        console.error(error)
      }
    }

    getAnimalsHorizontalNavigation()
  }, [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  function formatDate(date: Date): string | undefined {
    return date ? date.toISOString().split('T')[0] : undefined
  }

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['animal-List-Animal-History-Report', search, activeTab, filtersKey],
    initialPageParam: 1,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const params = {
        page_no: pageParam,
        limit: PAGE_SIZE,
        q: search,
        type: activeTab,
        end_date: formatDate(new Date()),
        ...filterParams
      }
      const res = (await getAnimalListForObservationReport(params)) as any

      return {
        animals: res?.data?.animals || [],
        nextPage: res?.data?.animals?.length === PAGE_SIZE ? pageParam + 1 : undefined,
        total_animal_count: res?.data?.total_animal_count || 0
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage
  })

  useEffect(() => {
    if (open) {
      setLocalSearch('')
      setSearch('')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setFilterDrawerOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      queryClient.cancelQueries({ queryKey: ['animal-List-Animal-History-Report', search, activeTab, filtersKey] })
      queryClient.removeQueries({ queryKey: ['animal-List-Animal-History-Report'] })
      cooldownRef.current = false
    }
  }, [open, search, activeTab, filtersKey, queryClient])

  const list = useMemo(
    () =>
      data?.pages?.flatMap((page: any) =>
        page.animals.map((animal: Record<string, unknown>) => ({
          animal_id: animal?.animal_id,
          default_common_name: animal?.default_common_name,
          scientific_name: animal?.complete_name,
          user_enclosure_name: animal?.user_enclosure_name,
          section_name: animal?.section_name,
          site_name: animal?.site_name,
          type: animal?.type,
          sex: animal?.sex,
          default_icon: animal?.default_icon,
          total_animal: animal?.total_animal,
          local_identifier_name: animal?.local_identifier_name,
          local_identifier_value: animal?.local_identifier_value,
          site_id: animal?.site_id,
          enclosure_id: animal?.enclosure_id
        }))
      ) || [],
    [data]
  )
  const total = useMemo(() => (data?.pages?.[0] as any)?.total_animal_count || 0, [data])

  const cooldownRef = useRef<boolean>(false)

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }

  const handleTabClick = (tabValue: string) => {
    setActiveTab(tabValue)
  }

  const onGenerateClick = () => {
    handleAnimalClick(internalSelected)
    onClose()
  }

  return (
    <>
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
          <Box
            sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF' }}
          >
            <Typography
              sx={{
                fontSize: '24px',
                fontWeight: 500,
                fontFamily: 'Inter',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {t('compliance_module.select_the_animal')}
            </Typography>
            <IconButton
              onClick={() => {
                setInternalSelected(null)
                onClose()
              }}
            >
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              px: 4,
              background: '#FFF',
              pb: 4
            }}
          >
            <Search
              placeholder={t('compliance_module.search_by_animal_name_aid_or_identifier')}
              value={localSearch}
              onChange={handleSearchChange}
              fullWidth
              onClear={handleSearchClear}
              sx={{
                width: '100%',
                '& .MuiTextField-root': {
                  width: '100%'
                }
              }}
              inputStyle={{ py: '18px', px: '12px', width: '100%' }}
            />
            {showAnimalFilter && (
              <Box
                onClick={() => setFilterDrawerOpen(true)}
                sx={{
                  cursor: 'pointer',
                  height: '56px',
                  minWidth: '56px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Avatar
                  sx={{ height: '36px', width: '36px' }}
                  src={'/icons/filtericon.svg'}
                  // appliedFiltersCount={filterCount}
                  // icon='ic:round-tune'
                  // placement='bottom'
                />
              </Box>
            )}
          </Box>

          {showAnimalFilter && (
            <Box
              sx={{
                background: theme.palette.customColors.bodyBg,
                px: 4,
                pt: 3,
                pb: 3
              }}
            >
              {horizontalLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    pb: 1,
                    height: 48,
                    alignItems: 'center',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    '-ms-overflow-style': 'none'
                  }}
                >
                  {Array.from(new Array(4)).map((_, idx) => (
                    <Skeleton key={idx} variant='rectangular' width={150} height={40} sx={{ borderRadius: 1 }} />
                  ))}
                </Box>
              ) : (
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
                  {horizontalNavList.map((item, index) => (
                    <Button
                      key={index}
                      onClick={() => handleTabClick(item.type)}
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
                        backgroundColor: activeTab === item.type ? '#1F515B' : '#0000000D',
                        color: activeTab === item.type ? '#FFFFFF' : '#666666',
                        '&:hover':
                          activeTab === item.type
                            ? {
                                backgroundColor: '#1F515B !important'
                              }
                            : {
                                backgroundColor: '#e0ecee'
                              }
                      }}
                    >
                      {item.label} {activeTab === item.type && total ? ` (${total})` : ''}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          )}

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 4,
              bgcolor: theme.palette.customColors.bodyBg,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minHeight: 0,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
              '-ms-overflow-style': 'none',
              py: showAnimalFilter ? 1 : 4
            }}
          >
            {isFetching && list.length === 0 ? (
              <Box display='flex' justifyContent='center' alignItems='center' flex={1}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {list.map((animal: AnimalItem) => (
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
                    <NoDataFound variant='Seal' height={250} width={250} />
                  </Box>
                )}
                {hasNextPage && (
                  <Box ref={loaderRef} display='flex' justifyContent='center' py={2}>
                    <CircularProgress />
                  </Box>
                )}
                {!hasNextPage && list.length > 0 && (
                  <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled }}>
                    {t('compliance_module.no_more_species_to_load')}
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
              {btnText || t('compliance_module.generate_animal_history_report')}
            </Button>
          </Box>
        )}
      </Drawer>
      <AnimalFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApplyFilters={options => {
          const nextFilters = { ...EMPTY_FILTERS }
          Object.keys(nextFilters).forEach(key => {
            const k = key as keyof FilterValues
            nextFilters[k] = Array.isArray(options?.[k]) ? [...(options[k] as string[])] : []
          })
          setAppliedFilters(nextFilters)
          setFilterDrawerOpen(false)
        }}
        onSubmitLoading={isFetching}
        setFilterCount={setFilterCount}
        initialSelectedOptions={appliedFilters}
      />
    </>
  )
}

export default AnimalDrawer
