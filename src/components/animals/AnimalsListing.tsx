import {
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Tab,
  Tabs,
  Typography,
  useTheme,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  Skeleton,
  Tooltip
} from '@mui/material'
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'
import RenderUtility from 'src/utility/render'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Search from 'src/views/utility/Search'
import { getAnimalFilterList } from 'src/lib/api/compliance/reports'
import { useQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { getNewAnimalListWithFilters } from 'src/lib/api/hospital/inpatient'
import { useAuth } from 'src/hooks/useAuth'
import AnimalCard from 'src/views/utility/AnimalCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalFilterDrawer from './AnimalFilterDrawer'
import { format } from 'date-fns'
import { useRouter, usePathname } from 'next/navigation'

interface NavigationItem {
  label: string
  type: string
}

interface FilterDates {
  startDate: Date | string | null
  endDate: Date | string | null
}

interface AppliedFilters {
  Gender: string[]
  'Accession Date': FilterDates
  'Animal Type': string
}

const FALLBACK_IMAGE = '/images/branding/Antz_logomark_h_color.svg'

const AnimalCardSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', gap: '16px' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <Skeleton variant='circular' width={44} height={44} />
        <Skeleton variant='rounded' width={24} height={24} />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant='text' width='60%' height={20} />
        <Skeleton variant='text' width='80%' height={16} />
        <Skeleton variant='text' width='40%' height={14} />
        <Skeleton variant='text' width='50%' height={14} />
        <Skeleton variant='text' width='70%' height={14} />
      </Box>
    </Box>
  )
}

const EllipsisCell = ({
  text,
  fontWeight = 400,
  fontSize = '14px',
  color,
  fontStyle = 'normal'
}: {
  text: string | undefined | null
  fontWeight?: number
  fontSize?: string
  color?: string
  fontStyle?: string
}) => {
  const display = text || '-'
  return (
    <Tooltip title={display} placement='top' arrow>
      <Typography
        sx={{
          fontWeight,
          fontSize,
          fontStyle,
          color,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          width: '100%'
        }}
      >
        {display}
      </Typography>
    </Tooltip>
  )
}

const getImageType = (url: string | undefined): 'svg' | 'img' => {
  if (!url || typeof url !== 'string') return 'img'
  try {
    const parsedUrl = new URL(url)
    const encodedPath = parsedUrl.searchParams.get('path')
    if (!encodedPath) return 'img'
    const decodedPath = decodeURIComponent(encodedPath)
    return decodedPath.toLowerCase().endsWith('.svg') ? 'svg' : 'img'
  } catch {
    return 'img'
  }
}

const AnimalAvatarCell = ({ src: initialSrc }: { src: string | undefined }) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [src, setSrc] = useState(initialSrc)

  useEffect(() => {
    setSrc(initialSrc)
  }, [initialSrc])

  useEffect(() => {
    const img = new Image()
    img.src = initialSrc || ''
    img.onload = () => setImageLoading(false)
    img.onerror = () => setImageLoading(false)
  }, [initialSrc])

  const isFallback = src === FALLBACK_IMAGE

  if (imageLoading) return <Skeleton variant='circular' width={44} height={44} />

  return (
    <Avatar
      key={src}
      src={src || FALLBACK_IMAGE}
      alt=''
      sx={{
        width: 44,
        height: 44,
        '& img': {
          objectFit: getImageType(src) === 'svg' ? 'contain' : 'cover',
          padding: isFallback ? '4px' : 0
        }
      }}
      imgProps={{
        onError: () => setSrc(FALLBACK_IMAGE)
      }}
    />
  )
}

const AnimalsListing = () => {
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const auth = useAuth()
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const [searchValue, setSearchValue] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('')
  const [horizontalNavList, setHorizontalNavList] = useState<NavigationItem[]>([])
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid')

  // Filter drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    Gender: [],
    'Accession Date': { startDate: null, endDate: null },
    'Animal Type': ''
  })

  // Initialize filters from URL on mount only
  const [filters, setFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return {
        page: parseInt(params.get('page') || '1'),
        limit: parseInt(params.get('limit') || '10'),
        q: params.get('q') || ''
      }
    }
    return { page: 1, limit: 10, q: '' }
  })

  const [sortModel, setSortModel] = useState<any[]>([])

  // Update URL without triggering navigation (state is source of truth)
  const updateUrlParams = (updatedFilters: { page: number; limit: number; q: string }) => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    const queryString = params.toString()
    window.history.replaceState({}, '', `${pathname}?${queryString}`)
  }

  // Ref for updateUrlParams to use in debounced callback
  const updateUrlParamsRef = useRef(updateUrlParams)
  updateUrlParamsRef.current = updateUrlParams

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'Grid' | 'List' | null) => {
    if (newMode !== null) {
      setViewMode(newMode)
      if (newMode === 'List') {
        const updated = { ...filters, page: 1 }
        setFilters(updated)
        updateUrlParams(updated)
      }
    }
  }

  // Pagination handler (matching inpatient pattern - no useCallback)
  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    const updated = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleSortModel = (model: any) => {
    setSortModel(model)
    setFilters(prev => ({ ...prev, page: 1 }))
  }
  const handleRowClick = (params: any) => {
    const animalId = params?.row?.animal_id || params?.id
    if (animalId) {
      router.push(`/housing/animals/${animalId}`)
    }
  }

  const handleAnimalCardClick = (animalId: number | string) => {
    if (animalId) {
      router.push(`/housing/animals/${animalId}`)
    }
  }

  const handleFilterDrawerOpen = () => {
    setFilterDrawerOpen(true)
  }

  const handleFilterDrawerClose = () => {
    setFilterDrawerOpen(false)
  }

  const handleApplyFilters = (newFilters: AppliedFilters) => {
    setAppliedFilters(newFilters)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  // Debounced search (matching inpatient pattern)
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(prev => {
          const updated = {
            ...prev,
            q: value,
            page: 1
          }
          updateUrlParamsRef.current(updated)
          return updated
        })
      }, 500),
    []
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const { ref: loaderRef, inView } = useInView({ threshold: 0, rootMargin: '200px' })

  const buildFilterParams = useCallback(() => {
    const params: Record<string, any> = {}

    if (appliedFilters.Gender.length > 0) {
      params.gender = appliedFilters.Gender
    }

    if (appliedFilters['Accession Date'].startDate && appliedFilters['Accession Date'].endDate) {
      params.accession_start_date = format(new Date(appliedFilters['Accession Date'].startDate), 'yyyy-MM-dd')
      params.accession_end_date = format(new Date(appliedFilters['Accession Date'].endDate), 'yyyy-MM-dd')
    }

    if (appliedFilters['Animal Type']) {
      params.type = appliedFilters['Animal Type']
    }

    return params
  }, [appliedFilters])

  // Grid view infinite scroll state
  const [gridPage, setGridPage] = useState(1)
  const [gridData, setGridData] = useState<any[]>([])
  const [gridTotalCount, setGridTotalCount] = useState(0)

  // Reset grid data when filters/search/tab/view changes
  useEffect(() => {
    if (viewMode === 'Grid') {
      setGridPage(1)
      setGridData([])
    }
  }, [activeTab, filters.q, appliedFilters, viewMode])

  // Single query for both Grid and List views
  const { data: animalsData, isFetching } = useQuery({
    queryKey: [
      'animalsList',
      activeTab,
      filters.q,
      zooId,
      appliedFilters,
      viewMode,
      viewMode === 'Grid' ? gridPage : filters.page,
      viewMode === 'Grid' ? 10 : filters.limit,
      sortModel
    ],
    enabled: !!activeTab && !!zooId,
    queryFn: async () => {
      const filterParams = buildFilterParams()
      const activeSortModel = sortModel[0]

      const params: Record<string, any> = {
        animal_list_type: activeTab,
        list_type: 'animals',
        page_no: viewMode === 'Grid' ? gridPage : filters.page,
        limit: viewMode === 'Grid' ? 10 : filters.limit,
        q: filters.q,
        zoo_id: zooId,
        ...filterParams,
        ...(viewMode === 'List' &&
          activeSortModel && {
            sort: activeSortModel.sort,
            column: activeSortModel.field
          })
      }

      const res = await getNewAnimalListWithFilters(params)
      return {
        animals: res?.data || [],
        total_count: res?.total_count || 0
      }
    }
  })

  // Accumulate data for Grid view infinite scroll
  useEffect(() => {
    if (viewMode === 'Grid' && animalsData?.animals) {
      setGridTotalCount(animalsData.total_count)
      if (gridPage === 1) {
        setGridData(animalsData.animals)
      } else {
        setGridData(prev => [...prev, ...animalsData.animals])
      }
    }
  }, [animalsData, viewMode, gridPage])

  // Check if there are more pages for Grid view
  const hasNextPage = viewMode === 'Grid' && gridPage * 10 < gridTotalCount

  // Load next page when user scrolls to bottom (Grid view)
  useEffect(() => {
    if (inView && hasNextPage && !isFetching && viewMode === 'Grid') {
      setGridPage(prev => prev + 1)
    }
  }, [inView, hasNextPage, isFetching, viewMode])

  // Data for Grid view (infinite scroll)
  const gridList = gridData

  // Data for List view (paginated)
  const tableList = animalsData?.animals || []
  const tableTotalCount = animalsData?.total_count || 0

  useEffect(() => {
    const getAnimalsHorizontalNavigation = async () => {
      try {
        const params = {}
        const response = await getAnimalFilterList({ params })
        if (response?.success) {
          setHorizontalNavList(response?.data)
          if (response?.data?.length > 0) {
            setActiveTab(response.data[0].type)
          }
        }
      } catch (error) {
        console.log('Error getting horizontal navigation list')
        console.error(error)
      }
    }

    getAnimalsHorizontalNavigation()
  }, [])

  const handleFilterChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
    // Reset pagination when tab changes
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  // Calculate SL.NO with proper pagination offset for List view (matching inpatient pattern)
  const getSlNo = (index: number) => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = tableList.map((item: any, idx: number) => ({
    ...item,
    id: item.animal_id || idx,
    sl_no: getSlNo(idx)
  }))

  const animalColumns = [
    {
      width: 80,
      field: 'sl_no',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: (params: any) => (
        <Typography
          sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px', fontWeight: 500, pl: 1 }}
        >
          {params.row?.sl_no}.
        </Typography>
      )
    },
    {
      width: 80,
      field: 'default_icon',
      headerName: 'Image',
      sortable: false,
      renderCell: (params: any) => <AnimalAvatarCell src={params.row?.default_icon} />
    },
    {
      minWidth: 150,
      width: 200,
      field: 'common_name',
      headerName: 'Common Name',
      sortable: true,
      renderCell: (params: any) => (
        <EllipsisCell
          text={params.row?.common_name || params.row?.default_common_name}
          fontWeight={600}
          color={theme.palette.customColors.OnSurfaceVariant}
        />
      )
    },
    {
      minWidth: 160,
      width: 200,
      field: 'scientific_name',
      headerName: 'Scientific Name',
      sortable: true,
      renderCell: (params: any) => (
        <EllipsisCell
          text={params.row?.scientific_name || params.row?.complete_name}
          fontWeight={600}
          color={theme.palette.customColors.OnSurfaceVariant}
        />
      )
    },
    {
      width: 150,
      field: 'animal_id',
      headerName: 'AID',
      sortable: true,
      renderCell: (params: any) => (
        <EllipsisCell
          text={params.row?.animal_id}
          fontWeight={600}
          color={theme.palette.customColors.OnSurfaceVariant}
        />
      )
    },
    {
      minWidth: 160,
      width: 200,
      field: 'primary_identifier',
      headerName: 'Identifier',
      sortable: false,
      renderCell: (params: any) => {
        const name = params.row?.local_identifier_name || params.row?.primary_identifier_name
        const value = params.row?.local_identifier_value || params.row?.primary_identifier_value
        const display = name && value ? `${name}: ${value}` : '-'
        return (
          <Tooltip title={display} placement='top' arrow>
            <Typography
              sx={{
                fontSize: '14px',
                color: theme.palette.customColors.OnSurfaceVariant,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
            >
              {name && value ? (
                <>
                  <span style={{ color: theme.palette.text.secondary, fontSize: '12px' }}>{name}: </span>
                  <strong>{value}</strong>
                </>
              ) : (
                '-'
              )}
            </Typography>
          </Tooltip>
        )
      }
    },
    {
      minWidth: 120,
      width: 200,
      field: 'site_name',
      headerName: 'Site',
      sortable: true,
      renderCell: (params: any) => (
        <EllipsisCell text={params.row?.site_name} color={theme.palette.customColors.OnSurfaceVariant} />
      )
    },
    {
      minWidth: 120,
      width: 200,
      field: 'section_name',
      headerName: 'Section',
      sortable: true,
      renderCell: (params: any) => (
        <EllipsisCell text={params.row?.section_name} color={theme.palette.customColors.OnSurfaceVariant} />
      )
    },
    {
      minWidth: 130,
      width: 200,
      field: 'user_enclosure_name',
      headerName: 'Enclosure',
      sortable: true,
      renderCell: (params: any) => (
        <EllipsisCell text={params.row?.user_enclosure_name} color={theme.palette.customColors.OnSurfaceVariant} />
      )
    }
  ]

  return (
    <>
      <Box>
        <Breadcrumbs>
          <Typography>Animals</Typography>
        </Breadcrumbs>
        <Card sx={{ mt: 6 }}>
          <CardHeader title={RenderUtility.pageTitle('Animals')} />
          <CardContent>
            <Box sx={{ display: ' flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Search
                value={searchValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                onClear={handleSearchClear}
                placeholder='Search animals...'
                width='100%'
                borderRadius='8px'
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FilterButtonWithNotification appliedFiltersCount={filterCount} onClick={handleFilterDrawerOpen} />
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size='small'
                  sx={{
                    '& .MuiToggleButton-root': {
                      px: 2,
                      py: 0.5
                    }
                  }}
                >
                  <ToggleButton value='Grid'>
                    <Icon icon='mdi:grid' fontSize={18} />
                  </ToggleButton>
                  <ToggleButton value='List'>
                    <Icon icon='mdi:format-list-bulleted' fontSize={18} />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
            <Tabs
              value={activeTab || false}
              variant='scrollable'
              scrollButtons='auto'
              onChange={handleFilterChange}
              sx={{
                mt: 2,
                minHeight: 40,
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main,
                  height: 2,
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  minHeight: 40,
                  maxWidth: 'none',
                  color: theme.palette.customColors.neutralSecondary,
                  borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    borderBottom: 'none'
                  }
                }
              }}
            >
              {horizontalNavList.map((item, index) => (
                <Tab key={index} label={item.label} value={item.type} />
              ))}
            </Tabs>
            {/* Initial loading state for Grid view - skeleton cards */}
            {viewMode === 'Grid' && isFetching && gridList.length === 0 && (
              <Grid container spacing={6} sx={{ mt: 4 }}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`skeleton-${idx}`}>
                    <Box
                      sx={{
                        p: 4,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        height: '100%',
                        backgroundColor: theme.palette.background.paper
                      }}
                    >
                      <AnimalCardSkeleton />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
            {/* Empty state for Grid view */}
            {viewMode === 'Grid' && gridList.length === 0 && !isFetching && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography color='text.secondary'>No animals found</Typography>
              </Box>
            )}
            {viewMode === 'Grid' ? (
              <>
                {gridList.length > 0 && (
                  <Grid container spacing={6} sx={{ mt: 4 }}>
                    {gridList.map((animal: any, idx: number) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={animal.animal_id || idx}>
                        <Box
                          onClick={() => handleAnimalCardClick(animal.animal_id)}
                          sx={{
                            p: 4,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            height: '100%',
                            backgroundColor: theme.palette.background.paper,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              boxShadow: theme.shadows[2]
                            }
                          }}
                        >
                          <AnimalCard data={animal} />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
                {/* Infinite scroll sentinel – always rendered so observer can watch it */}
                <Box ref={loaderRef} sx={{ display: 'flex', justifyContent: 'center', p: 2, minHeight: 1 }}>
                  {isFetching && gridList.length > 0 && <CircularProgress size={28} />}
                </Box>
              </>
            ) : (
              <Box sx={{ mt: 4 }}>
                <CommonTable
                  columns={animalColumns}
                  indexedRows={indexedRows}
                  total={tableTotalCount}
                  loading={isFetching}
                  rowHeight={65}
                  paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                  setPaginationModel={handlePaginationModelChange}
                  handleSortModel={handleSortModel}
                  pageSizeOptions={[10, 25, 50, 100]}
                  onRowClick={handleRowClick}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Animal Filter Drawer */}
      <AnimalFilterDrawer
        open={filterDrawerOpen}
        onClose={handleFilterDrawerClose}
        onApplyFilters={handleApplyFilters}
        setFilterCount={setFilterCount}
        initialSelectedOptions={appliedFilters}
      />
    </>
  )
}

export default AnimalsListing
