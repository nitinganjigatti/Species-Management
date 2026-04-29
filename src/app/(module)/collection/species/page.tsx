'use client'

import { useTheme } from '@mui/material/styles'
import {
  Avatar,
  Box,
  Button,
  Card,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from '@mui/material'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import moment from 'moment'
import toast from 'react-hot-toast'
import CircularProgress from '@mui/material/CircularProgress'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import Icon from 'src/@core/components/icon'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import StatChip from 'src/views/utility/StatChip'
import SpeciesFilterDrawer, {
  SpeciesFilterOptions,
  DEFAULT_SPECIES_FILTERS
} from 'src/components/collection/SpeciesFilterDrawer'
import SpeciesDrawer from 'src/components/housing/utils/SpeciesDrawer'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import AddAnimalDrawer from 'src/components/collection/AddAnimalDrawer'
import { getCollectionInsights, mapInsightsResponse } from 'src/lib/api/collection/species'
import { getReportFilterList } from 'src/lib/api/report'

/** Map a row from /v1/species/reportv1 datalist into table row format */
const mapSpeciesReportRow = (item: any, index: number) => ({
  // tsn_id repeats across rows (one row per species × enclosure) — composite id keeps DataGrid keys unique
  id: `${index}_${item.tsn_id}`,
  species_id: item.tsn_id,
  species_name: item.common_name,
  scientific_name: item.scientific_name,
  image: item.default_icon,
  population: Number(item.animal_count) || 0,
  male: Number(item.total_male) || 0,
  female: Number(item.total_female) || 0,
  undetermined: Number(item.total_undetermined) || 0,
  identified: Number(item.total_indeterminate) || 0,
  rank: item.rank_label || '-',
  is_hybrid: item.is_hybrid || '-',
  class_name: item.class_name || '-',
  order_name: item.order_name || '-',
  family: item.family_name || '-',
  genus: item.genus_name || '-',
  site: item.site_name || '-',
  section: item.section_name || '-',
  enclosure: item.user_enclosure_name || '-',
  organisation: item.organization_name || '-',
  cluster: item.cluster_name || '-'
})

const CollectionSpecies = () => {
  const theme = useTheme()
  const router = useRouter()

  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState({ page: 1, limit: 10, q: '' })
  const [speciesFilter, setSpeciesFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [insightsFilterDate, setInsightsFilterDate] = useState({
    startDate: moment().subtract(6, 'months').toDate(),
    endDate: new Date()
  })
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [addAnimalDrawerOpen, setAddAnimalDrawerOpen] = useState(false)
  const [animalDrawerOpen, setAnimalDrawerOpen] = useState(false)
  const [animalDrawerData, setAnimalDrawerData] = useState<any>(null)
  const [animalTotalCount, setAnimalTotalCount] = useState(0)
  const [filterCount, setFilterCount] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const [appliedFilters, setAppliedFilters] = useState<SpeciesFilterOptions>({ ...DEFAULT_SPECIES_FILTERS })

  // Fetch species listing — /v1/species/reportv1. All include_* flags on so the table renders the
  // designed columns. (appliedFilters captured but not wired — backend doesn't yet accept those filters.)
  const { data: speciesResponse, isLoading } = useQuery({
    queryKey: ['collection-species-report', filters],
    queryFn: () =>
      getReportFilterList({
        page: filters.page,
        limit: filters.limit,
        q: filters.q,
        include_class: 1,
        include_order: 1,
        include_family: 1,
        include_genus: 1,
        include_site: 1,
        include_section: 1,
        include_enclosure: 1,
        include_organization: 1,
        include_cluster: 1,
        include_housing: 0
      }),
    placeholderData: (prev: any) => prev
  })

  // Fetch population insights (banner totals + stat cards)
  const insightsDateParams = useMemo(
    () => ({
      start_date: moment(insightsFilterDate.startDate).format('YYYY-MM-DD'),
      end_date: moment(insightsFilterDate.endDate).format('YYYY-MM-DD')
    }),
    [insightsFilterDate.startDate, insightsFilterDate.endDate]
  )

  const { data: insightsResponse, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['collection-insights', insightsDateParams],
    queryFn: () => getCollectionInsights(insightsDateParams),
    placeholderData: (prev: any) => prev
  })

  const insights = useMemo(() => mapInsightsResponse(insightsResponse), [insightsResponse])

  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const speciesList = useMemo(
    () =>
      (speciesResponse?.data?.datalist || []).map((item: any, index: number) => ({
        ...mapSpeciesReportRow(item, index),
        sl_no: getSlNo(index)
      })),
    [speciesResponse, filters.page, filters.limit]
  )

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    setFilters(prev => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize
    }))
  }
  const totalCount = Number(speciesResponse?.data?.total_count) || 0
  const [speciesDrawerOpen, setSpeciesDrawerOpen] = useState(false)
  const [speciesDrawerTitle, setSpeciesDrawerTitle] = useState('')
  const [speciesDrawerIcon, setSpeciesDrawerIcon] = useState<string | undefined>(undefined)
  const [speciesDrawerData, setSpeciesDrawerData] = useState<any>(null)

  const handleStatClick = (title: string, insightType: string, icon?: string) => {
    setSpeciesDrawerTitle(title)
    setSpeciesDrawerIcon(icon)
    setSpeciesDrawerData({
      queryKey: `collection-${insightType}-species`,
      id: 'all',
      name: '',
      params: { insight_type: insightType }
    })
    setSpeciesDrawerOpen(true)
  }
  const handleInsightsDateChange = (start: Date, end: Date) => {
    setInsightsFilterDate({ startDate: start, endDate: end })
    // TODO: Refetch insights data based on date range
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(prev => ({ ...prev, q: value, page: 1 }))
      }, 500),
    []
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  // Download species report as CSV — same /v1/species/reportv1 endpoint with response_type='csv'.
  // All include_* flags on so the CSV contains every column. Page/limit omitted so the export
  // covers the full dataset (not just the current page). Honors the active search.
  // The API returns a presigned URL string in `response.data`; we open it via a temp <a> to trigger download.
  const handleDownload = async () => {
    if (isDownloading) return
    try {
      setIsDownloading(true)
      const response: any = await getReportFilterList({
        q: filters.q,
        include_class: 1,
        include_order: 1,
        include_family: 1,
        include_genus: 1,
        include_site: 1,
        include_section: 1,
        include_enclosure: 1,
        include_organization: 1,
        include_cluster: 1,
        include_housing: 1,
        response_type: 'csv'
      })

      const csvUrl = response?.data
      if (typeof csvUrl === 'string' && csvUrl) {
        const link = document.createElement('a')
        link.href = csvUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast.error('Could not generate report')
      }
    } catch {
      toast.error('Error connecting to the server')
    } finally {
      setIsDownloading(false)
    }
  }

  const columns = [
    {
      width: 60,
      sortable: false,
      field: 'sl_no',
      headerName: 'NO',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      minWidth: 200,
      flex: 1,
      sortable: false,
      field: 'species_name',
      headerName: 'SPECIES',
      renderCell: (params: GridRenderCellParams) => (
        <SpeciesCard
          species={{
            common_name: params.row.species_name,
            scientific_name: params.row.scientific_name,
            default_icon: params.row.image || '/images/housing/species-icon-colored.svg'
          }}
        />
      )
    },
    {
      width: 120,
      sortable: false,
      field: 'population',
      headerName: 'POPULATION',
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            setAnimalDrawerData({
              queryKey: 'species-animals-drawer',
              id: params.row.species_id,
              name: params.row.species_name,
              image: params.row.image,
              common_name: params.row.species_name,
              complete_name: params.row.scientific_name,
              default_icon: params.row.image || '/images/housing/species-icon-colored.svg',
              sex_data: {
                male: params.row.male,
                female: params.row.female,
                undetermined: params.row.undetermined,
                indeterminate: params.row.identified
              },
              animal_count: params.row.population,
              enclosure_name: params.row.enclosure,
              section_name: params.row.section,
              params: {
                taxonomy_id: params.row.species_id
              }
            })
            setAnimalTotalCount(params.row.population || 0)
            setAnimalDrawerOpen(true)
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.customColors.OnSurface }}>
            {params.row.population?.toLocaleString()}
          </Typography>
        </Box>
      )
    },
    {
      width: 100,
      sortable: false,
      field: 'male',
      headerName: 'MALE',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <StatChip value={params.row.male} bgcolor={`${theme.palette.customColors.SecondaryContainer}80`} color={theme.palette.customColors.addPrimary} />
        </Box>
      )
    },
    {
      width: 100,
      sortable: false,
      field: 'female',
      headerName: 'FEMALE',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <StatChip value={params.row.female} bgcolor={`${theme.palette.customColors.Tertiary}4D`} color={theme.palette.customColors.Tertiary} />
        </Box>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'undetermined',
      headerName: 'UNDETERMINED',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <StatChip value={params.row.undetermined} bgcolor={theme.palette.customColors.SurfaceVariant} color={theme.palette.customColors.Error} />
        </Box>
      )
    },
    {
      width: 120,
      sortable: false,
      field: 'identified',
      headerName: 'IDENTIFIED',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <StatChip value={params.row.identified} bgcolor={theme.palette.customColors.displaybgSecondary} color={theme.palette.customColors.OnSecondaryContainer} />
        </Box>
      )
    },
    {
      width: 110,
      sortable: false,
      field: 'class_name',
      headerName: 'CLASS',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{params.row.class_name}</Typography>
        </Box>
      )
    },
    {
      width: 130,
      sortable: false,
      field: 'order_name',
      headerName: 'ORDER',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{params.row.order_name}</Typography>
        </Box>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'family',
      headerName: 'FAMILY',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{params.row.family}</Typography>
        </Box>
      )
    },
    {
      width: 120,
      sortable: false,
      field: 'genus',
      headerName: 'GENUS',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>{params.row.genus}</Typography>
        </Box>
      )
    },
    {
      width: 160,
      sortable: false,
      field: 'site',
      headerName: 'SITES',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500 }}>{params.row.site}</Typography>
        </Box>
      )
    },
    {
      width: 180,
      sortable: false,
      field: 'section',
      headerName: 'SECTIONS',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500 }}>{params.row.section}</Typography>
        </Box>
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'enclosure',
      headerName: 'ENCLOSURES',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500 }}>{params.row.enclosure}</Typography>
        </Box>
      )
    },
    {
      width: 180,
      sortable: false,
      field: 'organisation',
      headerName: 'ORGANISATION',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurface, fontWeight: 500 }}>{params.row.organisation}</Typography>
        </Box>
      )
    }
  ]

  const handleCellClick = (params: any) => {
    if (params.field === 'sl_no' || params.field === 'species_name') {
      router.push(`/collection/species/${params.row.species_id}`)
    }
  }

  // Banner data — driven by /v2/collection/insights
  const bannerSummaryStats = [
    { value: insights.speciesCount, label: 'Species' },
    { value: insights.population, label: 'Population' }
  ]

  // InsightsCard statsData (uses imagePath icons — same pattern as cluster/site pages)
  // Note: API does not currently return external_transfer — TODO: wire when backend adds it
  const insightsStatsData = [
    {
      value: insights.birthCount,
      label: 'Natality',
      imagePath: '/images/collection/natality.svg',
      onClick: () => handleStatClick('Natality', 'natality', '/images/collection/natality.svg')
    },
    {
      value: insights.totalAccession,
      label: 'Accession',
      imagePath: '/images/collection/accession.svg',
      onClick: () => handleStatClick('Accession', 'accession', '/images/collection/accession.svg')
    },
    {
      value: 0,
      label: 'External transfer',
      imagePath: '/images/collection/external_transfer.svg',
      onClick: () => handleStatClick('External transfer', 'external_transfer', '/images/collection/external_transfer.svg')
    },
    {
      value: insights.mortalityCount,
      label: 'Mortality',
      imagePath: '/images/collection/mortality.svg',
      onClick: () => handleStatClick('Mortality', 'mortality', '/images/collection/mortality.svg')
    }
  ]

  return (
    <>
      <Box>
        <DynamicBreadcrumbs sx={{ mb: 5 }} />

        {/* InsightsCard Banner */}
        <Box>
          <InsightsCard
            data={insights}
            loading={isInsightsLoading}
            error={null}
            isListingPage
            pageTitle='All Species'
            image='/images/housing/testInDev.jpg'
            actions={{ onAddNew: () => setAddAnimalDrawerOpen(true) }}
            addNewTooltip='Add Animals'
            addNewLabel='Add Animals'
            onCallClick={null}
            onMessageClick={null}
            zooName=''
            subtitle=''
            userName=''
            description=''
            userImage=''
            summaryStats={bannerSummaryStats as any}
            haveInsightsViewAccess
            statsData={insightsStatsData as any}
            insightsTitle='Population Insights'
            onInsightsDateChange={handleInsightsDateChange as any}
            insightsFilterDates={insightsFilterDate as any}
          />
        </Box>

        {/* Species Table */}
        <Box sx={{ mt: 6 }}>
          <Card>
            {/* Table Header: Title + Download */}
            <Box
              sx={{
                px: 5,
                pt: 5,
                pb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
                Species List ({totalCount.toLocaleString()})
              </Typography>
              <Button
                variant='text'
                onClick={handleDownload}
                disabled={isDownloading}
                endIcon={
                  isDownloading ? (
                    <CircularProgress size={16} sx={{ color: theme.palette.customColors.OnSurface }} />
                  ) : (
                    <Icon icon='solar:download-square-linear' />
                  )
                }
                sx={{
                  color: theme.palette.customColors.OnSurface,
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '0.875rem'
                }}
              >
                {isDownloading ? 'Preparing…' : 'Download'}
              </Button>
            </Box>

            {/* Toolbar: Search + Filters + View Toggle */}
            <Box
              sx={{
                px: 5,
                pb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3
              }}
            >
              {/* Search */}
              <Search
                borderRadius='4px'
                width='220px'
                placeholder='Search'
                value={searchValue}
                onClear={handleSearchClear}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                textFielsSX={{
                  '& .MuiInputBase-input::placeholder': { fontSize: '13px' }
                }}
              />

              {/* Right side controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                {/* Species Dropdown */}
                <FormControl sx={{ minWidth: 150 }}>
                  <Select
                    value={speciesFilter}
                    onChange={e => setSpeciesFilter(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.customColors.OutlineVariant
                      }
                    }}
                    size='small'
                  >
                    <MenuItem value='all'>All Species</MenuItem>
                    <MenuItem value='mammals'>Mammals</MenuItem>
                    <MenuItem value='birds'>Birds</MenuItem>
                    <MenuItem value='reptiles'>Reptiles</MenuItem>
                    <MenuItem value='amphibians'>Amphibians</MenuItem>
                    <MenuItem value='insects'>Insects</MenuItem>
                  </Select>
                </FormControl>

                {/* Filter Button */}
                <FilterButtonWithNotification
                  label='Filter'
                  onClick={() => setFilterDrawerOpen(true)}
                  appliedFiltersCount={filterCount || undefined}
                />

                {/* View Toggle */}
                {/* <Box
                  sx={{
                    display: 'flex',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <Tooltip title='Card View' arrow>
                    <IconButton
                      size='small'
                      onClick={() => setViewMode('card')}
                      sx={{
                        borderRadius: 0,
                        px: 1.5,
                        backgroundColor:
                          viewMode === 'card' ? theme.palette.customColors.Surface : 'transparent',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      <Icon icon='mdi:view-grid-outline' fontSize={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='List View' arrow>
                    <IconButton
                      size='small'
                      onClick={() => setViewMode('table')}
                      sx={{
                        borderRadius: 0,
                        px: 1.5,
                        backgroundColor:
                          viewMode === 'table' ? theme.palette.customColors.Surface : 'transparent',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      <Icon icon='mdi:view-list-outline' fontSize={20} />
                    </IconButton>
                  </Tooltip>
                </Box> */}
              </Box>
            </Box>

            {/* Table */}
            <Box sx={{ mx: 5, mb: 5 }}>
              <CommonTable
                columns={columns}
                indexedRows={speciesList}
                total={totalCount}
                loading={isLoading}
                paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                setPaginationModel={handlePaginationModelChange}
                handleSortModel={() => {}}
                searchValue=''
                getRowHeight={() => 'auto'}
                onRowClick={() => {}}
                onCellClick={handleCellClick}
                externalTableStyle={{
                  '& .MuiDataGrid-cell': {
                    py: 2.5,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center'
                  },
                  '& .MuiDataGrid-row:hover': {
                    cursor: 'pointer'
                  },
                  '& .MuiDataGrid-columnHeader': {
                    px: 3
                  },

                  // Sticky NO column (1st column)
                  '& .MuiDataGrid-cell[data-field="sl_no"]': {
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    backgroundColor: theme.palette.background.paper
                  },
                  '& .MuiDataGrid-columnHeader[data-field="sl_no"]': {
                    position: 'sticky',
                    left: 0,
                    zIndex: 5,
                    backgroundColor: theme.palette.customColors.customTableHeaderBg
                  },

                  // Sticky SPECIES column (2nd column) — offset by NO column width (60px)
                  '& .MuiDataGrid-cell[data-field="species_name"]': {
                    position: 'sticky',
                    left: 60,
                    zIndex: 3,
                    backgroundColor: theme.palette.background.paper,
                    borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  },
                  '& .MuiDataGrid-columnHeader[data-field="species_name"]': {
                    position: 'sticky',
                    left: 60,
                    zIndex: 5,
                    backgroundColor: theme.palette.customColors.customTableHeaderBg,
                    borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
                  },

                  // Maintain sticky bg on row hover
                  '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="sl_no"]': {
                    backgroundColor: theme.palette.customColors.Surface
                  },
                  '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="species_name"]': {
                    backgroundColor: theme.palette.customColors.Surface
                  }
                }}
              />
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Add Animal Drawer */}
      <AddAnimalDrawer
        open={addAnimalDrawerOpen}
        onClose={() => setAddAnimalDrawerOpen(false)}
        onSuccess={() => {
          // TODO: Refetch species list after animal is added
        }}
      />

      {/* Animal Population Drawer */}
      {animalDrawerOpen && (
        <AnimalDrawer
          open={!!animalDrawerData}
          onClose={() => {
            setAnimalDrawerOpen(false)
            setAnimalDrawerData(null)
          }}
          data={animalDrawerData}
          totalCount={animalTotalCount}
          defaultImage='/images/housing/species-icon-colored.svg'
          objectFit='contain'
          title='Population'
        />
      )}

      {/* Insights Species Drawer (Natality/Accession/External Transfer/Mortality) */}
      <SpeciesDrawer
        open={speciesDrawerOpen}
        onClose={() => {
          setSpeciesDrawerOpen(false)
          setSpeciesDrawerData(null)
        }}
        data={speciesDrawerData}
        title={speciesDrawerTitle}
        icon={speciesDrawerIcon}
      />

      {/* Species Filter Drawer */}
      <SpeciesFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApplyFilters={f => {
          setAppliedFilters(f)
          // TODO: API does not yet accept Gender/Class/Order/Family/Genus as data filters —
          // wire applied filters into the listing query once backend support is added.
        }}
        setFilterCount={setFilterCount}
        initialSelectedOptions={appliedFilters}
      />
    </>
  )
}

export default CollectionSpecies
