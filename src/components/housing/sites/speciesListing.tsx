import { useTheme } from '@emotion/react'
import { Box, Grid, Typography, useMediaQuery, Theme } from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import SpeciesDrawer from 'src/components/housing/utils/SpeciesDrawer'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { GenderInfoCard } from 'src/utility/render'
import { getAllSpeciesList } from 'src/lib/api/housing'
import AnimalDrawer from '../utils/AnimalDrawer'
import { useAuth } from 'src/hooks/useAuth'
import { DrawerType, DrawerData, SpeciesFilters, IndexedSpeciesRow } from 'src/types/housing'
import { GridCellParams, GridSortModel } from '@mui/x-data-grid'
import { useTranslation } from 'react-i18next'

interface SpeciesRow {
  tsn_id: number
  common_name: string
  complete_name: string
  default_icon?: string
  animal_count?: number
  sex_data?: {
    male?: number
    female?: number
    undetermined?: number
    indeterminate?: number
  }
  images?: Array<{ file?: string }>
}

interface SpeciesListingProps {
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
}

interface PaginationModel {
  page: number
  pageSize: number
}

const SpeciesListing: React.FC<SpeciesListingProps> = ({ selectedTab, setSelectedTab, drawerType, setDrawerType, drawerData, setDrawerData }) => {
  const { t } = useTranslation()
  const theme = useTheme() as Theme
  const router = useSafeRouter()
  const { id } = router.query
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [specieName, setSpecieName] = useState<string>('')

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  const [filters, setFilters] = useState<SpeciesFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const [inputValue, setInputValue] = useState<string>('')
  const [downloading, setDownloading] = useState<boolean>(false)
  const [totalCount, setTotalCount] = useState<number>(0)

  const { data, isLoading } = useQuery({
    queryKey: ['site-species', id, filters],
    queryFn: () =>
      getAllSpeciesList({
        site_id: Number(id),
        page_no: filters.page,
        limit: filters.pageSize,
        search: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder as 'asc' | 'desc' | undefined
      }),
    enabled: !!id
  })

  const listing = (data?.data?.listing || []) as unknown as SpeciesRow[]
  const total: number = data?.data?.total_scies_count || 0

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = useMemo(
    () =>
      listing.map((row, index) => ({
        ...row,
        id: +row?.tsn_id,
        sl_no: getSlNo(index)
      })),
    [listing, filters.page, filters.pageSize]
  )

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(prev => ({
          ...prev,
          search: value,
          page: 1
        }))
      }, 500),
    []
  )

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  const handleSearch = (value: string): void => {
    setInputValue(value)
    debouncedSearch(value)
  }

  const handleSortModelChange = (model: GridSortModel): void => {
    if (model.length > 0) {
      const { field, sort } = model[0]
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: sort as 'asc' | 'desc',
        page: 1
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: '',
        sortOrder: 'asc',
        page: 1
      }))
    }
  }

  const handlePaginationModelChange = (model: PaginationModel): void => {
    setFilters(prev => ({
      ...prev,
      page: model.page + 1,
      pageSize: model.pageSize
    }))
  }

  const handleRowClick = (params: GridCellParams): void => {
    if (params.field !== 'id' && params.field !== 'actions') {
      setOpenDrawer(true)
      setSpecieName((params.row as SpeciesRow & { id: number; sl_no: number }).common_name)
    }
  }

  const handleClose = (): void => setOpenDrawer(false)

  const handleDownload = (): void => {
    console.log('Downloading...')
  }

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const columns = [
    {
      width: 90,
      field: 'id',
      headerName: t('s_no') as string,
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            pl: 2
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.neutralSecondary,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {parseInt((params.row as { sl_no: number }).sl_no.toString()) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 350,
      field: 'common_name',
      headerName: t('species') as string,
      headerAlign: 'left' as const,
      align: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            cursor: 'default'
          }}
        >
          <SpeciesCard
            species={{
              common_name: (params.row as SpeciesRow).common_name,
              scientific_name: (params.row as SpeciesRow).complete_name,
              default_icon: (params.row as SpeciesRow).default_icon || '/images/housing/species-icon-colored.svg'
            }}
          />
        </Box>
      )
    },
    ...(insightsViewAccess
      ? [
          {
            width: 180,
            field: 'animals',
            headerName: t('housing_module.population') as string,
            headerAlign: 'left' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  pl: 2,
                  justifyContent: 'left'
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('animals')
                  setDrawerData({
                    queryKey: 'species-animals-drawer',
                    id: (params.row as SpeciesRow & { id: number }).id,
                    name: (params.row as SpeciesRow).common_name,
                    image: (params.row as SpeciesRow).images?.[0]?.file,
                    params: {
                      taxonomy_id: (params.row as SpeciesRow & { id: number }).id,
                      site_id: id
                    }
                  })
                  setTotalCount((params.row as SpeciesRow).animal_count || 0)
                }}
              >
                <Typography
                  sx={{
                    color: (theme.palette as any).primary.OnSurface,
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {(params.row as SpeciesRow).animal_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 160,
            field: 'male',
            headerName: t('male') as string,
            headerAlign: 'center' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <GenderInfoCard
                  value={(params.row as SpeciesRow).sex_data?.male || 0}
                  bgcolor={`${theme.palette.customColors.SecondaryContainer}80`}
                  color={theme.palette.customColors.addPrimary}
                />
              </Box>
            )
          },
          {
            width: 160,
            field: 'female',
            headerName: t('female') as string,
            headerAlign: 'center' as const,
            align: 'center' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <GenderInfoCard
                  value={(params.row as SpeciesRow).sex_data?.female || 0}
                  bgcolor={`${theme.palette.customColors.customDropdownColor}4D`}
                  color={theme.palette.customColors.customDropdownColor}
                />
              </Box>
            )
          },
          {
            width: 160,
            field: 'undetermined',
            headerName: t('housing_module.undetermined') as string,
            headerAlign: 'center' as const,
            align: 'center' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <GenderInfoCard
                  value={(params.row as SpeciesRow).sex_data?.undetermined || 0}
                  bgcolor={theme.palette.customColors.SurfaceVariant}
                  color={theme.palette.customColors.Error}
                />
              </Box>
            )
          },
          {
            width: 160,
            field: 'indeterminate',
            headerName: t('housing_module.indeterminate') as string,
            headerAlign: 'left' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  pl: 2,
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={(params.row as SpeciesRow).sex_data?.indeterminate || 0}
                  bgcolor={theme.palette.customColors.displaybgSecondary}
                  color={theme.palette.customColors.OnPrimaryContainer}
                />
              </Box>
            )
          }
        ]
      : [])
  ]

  return (
    <>
      <ListingHeader title={t('housing_module.all_species')} totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
          <Search
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder={t('search') as string}
            sx={{ justifyContent: 'flex-end' }}
          />
          {/* <ExportButton loading={downloading} onClick={handleDownload} /> */}
        </Box>

        <Grid
          sx={{
            '& .MuiDataGrid-cell': {
              pt: 4,
              py: 6,
              px: 6
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '12px',
              fontWeight: 600,
              mr: 2
            }
          }}
        >
          <CommonTable
            onCellClick={handleRowClick}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{
              page: filters.page - 1,
              pageSize: filters.pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            handleSortModel={handleSortModelChange}
            loading={isLoading}
            searchValue={filters.search}
            maxHeight='80vh'
          />
        </Grid>
      </Box>

      {drawerType === 'animals' && (
        <AnimalDrawer
          totalCount={totalCount}
          defaultImage={'/images/housing/species-icon-colored.svg'}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData}
          objectFit={'contain'}
        />
      )}
    </>
  )
}

export default React.memo(SpeciesListing)
