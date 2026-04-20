import { useTheme, Theme } from '@emotion/react'
import { Box, Grid, Typography } from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useMemo, useState, useEffect, ChangeEvent, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { debounce, DebouncedFunc } from 'lodash'

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
import type { DrawerData, DrawerType } from 'src/types/housing'
import type { GridSortModel, GridCellParams, GridColDef } from '@mui/x-data-grid'

interface SpeciesFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: string
}

interface SexData {
  male?: number
  female?: number
  undetermined?: number
  indeterminate?: number
}

interface SpeciesImage {
  file?: string
}

interface SpeciesRow {
  tsn_id?: number
  common_name?: string
  complete_name?: string
  default_icon?: string
  animal_count?: number
  sex_data?: SexData
  images?: SpeciesImage[]
}

interface IndexedSpeciesRow extends SpeciesRow {
  id: number
  sl_no: number
}

interface SpeciesListingProps {
  selectedTab: string
  setSelectedTab: (tab: string) => void
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
}

interface PaginationModel {
  page: number
  pageSize: number
}

const SpeciesListing: React.FC<SpeciesListingProps> = ({
  selectedTab,
  setSelectedTab,
  drawerType,
  setDrawerType,
  drawerData,
  setDrawerData
}) => {
  const { t } = useTranslation()
  const theme = useTheme() as Theme & { palette: any }
  const router = useSafeRouter()
  const { id } = router.query

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

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  const { data, isLoading } = useQuery({
    queryKey: ['section-species', id, filters],
    queryFn: () =>
      getAllSpeciesList({
        section_id: Number(id),
        page_no: filters.page,
        limit: filters.pageSize,
        search: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder as 'asc' | 'desc' | undefined
      }),
    enabled: !!id
  })

  const listing: SpeciesRow[] = data?.data?.listing || []
  const total: number = data?.data?.total_scies_count || 0

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedSpeciesRow[] = useMemo(
    () =>
      listing.map((row, index) => ({
        ...row,
        id: +(row?.tsn_id || 0),
        sl_no: getSlNo(index)
      })),
    [listing, filters.page, filters.pageSize]
  )

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
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
        sortOrder: sort || 'asc',
        page: 1
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: '',
        sortOrder: '',
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

  const handleDownload = (): void => {
    console.log('Downloading...')
  }

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const columns: GridColDef[] = [
    {
      width: 90,
      field: 'id',
      headerName: t('s_no') as string,
      align: 'left',
      headerAlign: 'left',
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
            {parseInt(params.row.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 350,
      field: 'common_name',
      headerAlign: 'left',
      headerName: t('species') as string,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <SpeciesCard
          species={{
            common_name: params.row.common_name,
            scientific_name: params.row.complete_name,
            default_icon: params.row.default_icon
          }}
        />
      )
    },
    ...(insightsViewAccess
      ? [
          {
            width: 160,
            field: 'animals',
            headerName: t('housing_module.population'),
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
                  cursor: 'pointer'
                }}
                onClick={(e: MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation()
                  setDrawerType('animals')
                  setDrawerData({
                    queryKey: 'section-details-species-animals-drawer',
                    id: params.row.id,
                    name: params.row.common_name,
                    image: params.row.images?.[0]?.file,
                    params: {
                      tsn_id: params.row.id,
                      section_id: id
                    }
                  })
                  setTotalCount(params.row?.animal_count || 0)
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.primary.OnSurface,
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {params.row.animal_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 160,
            field: 'male',
            headerName: t('male'),
            headerAlign: 'center' as const,
            align: 'center' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <GenderInfoCard
                value={params.row.sex_data?.male || 0}
                bgcolor={`${theme.palette.customColors.SecondaryContainer}80`}
                color={theme.palette.customColors.addPrimary}
              />
            )
          },
          {
            width: 160,
            field: 'female',
            headerName: t('female'),
            headerAlign: 'center' as const,
            align: 'center' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <GenderInfoCard
                value={params.row.sex_data?.female || 0}
                bgcolor={`${theme.palette.customColors.customDropdownColor}4D`}
                color={theme.palette.customColors.customDropdownColor}
              />
            )
          },
          {
            width: 160,
            field: 'undetermined',
            headerName: t('housing_module.undetermined'),
            headerAlign: 'center' as const,
            align: 'center' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <GenderInfoCard
                value={params.row.sex_data?.undetermined || 0}
                bgcolor={theme.palette.customColors.SurfaceVariant}
                color={theme.palette.customColors.Error}
              />
            )
          },
          {
            width: 160,
            field: 'indeterminate',
            headerAlign: 'center' as const,
            align: 'center' as const,
            headerName: t('housing_module.indeterminate'),
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <GenderInfoCard
                value={params.row.sex_data?.indeterminate || 0}
                bgcolor={theme.palette.customColors.displaybgSecondary}
                color={theme.palette.customColors.OnPrimaryContainer}
              />
            )
          }
        ]
      : [])

    // {
    //   width: 160,
    //   field: 'actions',
    //   headerName: 'Actions',
    //   align: 'center',
    //   headerAlign: 'center',
    //   sortable: false,
    //   renderCell: () => (
    //     <Box display='flex' justifyContent='center' alignItems='center' gap={3}>
    //       <Box component='img' src='/images/call.png' alt='Phone' sx={{ width: 20, height: 20, cursor: 'pointer' }} />
    //       <Box
    //         component='img'
    //         src='/images/message.png'
    //         alt='Message'
    //         sx={{ width: 20, height: 20, cursor: 'pointer' }}
    //       />
    //     </Box>
    //   )
    // }
  ]

  return (
    <>
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap' }}>
          <ListingHeader title={t('housing_module.all_species')} totalCount={total} />
          <Search
            value={inputValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
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
            getRowHeight={() => 60}
            loading={isLoading}
            searchValue={filters.search}
            maxHeight='80vh'
          />
        </Grid>
      </Box>
      {drawerType === 'animals' && (
        <AnimalDrawer
          totalCount={totalCount}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData}
          defaultImage={'/images/housing/species-icon-colored.svg'}
          objectFit={'contain'}
        />
      )}
    </>
  )
}

export default React.memo(SpeciesListing)
