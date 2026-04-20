import { useTheme } from '@emotion/react'
import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { debounce, DebouncedFunc } from 'lodash'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useEffect, useMemo, useState, ChangeEvent, MouseEvent } from 'react'
import { getEnclosureWiseSpecies } from 'src/lib/api/housing'
import { GenderInfoCard } from 'src/utility/render'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import AnimalDrawer from '../utils/AnimalDrawer'
import { useAuth } from 'src/hooks/useAuth'
import type { DrawerData, DrawerType } from 'src/types/housing'
import type { GridSortModel, GridCellParams, GridColDef } from '@mui/x-data-grid'
import { useTranslation } from 'react-i18next'

interface EnclosureWiseSpeciesProps {
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
}

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

interface SpeciesRow {
  taxonomy_id?: number
  tsn_id?: number
  common_name: string
  complete_name?: string
  default_icon?: string
  animal_count?: number
  sex_data?: SexData
}

interface IndexedSpeciesRow extends SpeciesRow {
  id: number
  sl_no: number
}

interface PaginationModel {
  page: number
  pageSize: number
}

interface AnimalDrawerData {
  queryKey: string
  id: string | string[] | undefined
  complete_name?: string
  common_name: string
  animal_count?: number
  default_icon?: string
  sex_data?: SexData
  params: {
    enclosure_id: string | string[] | undefined
    taxonomy_id?: number
  }
}

const EnclosureWiseSpecies: React.FC<EnclosureWiseSpeciesProps> = ({
  drawerType,
  setDrawerType,
  drawerData,
  setDrawerData
}) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router: any = useSafeRouter()
  const { id } = router.query

  const [inputValue, setInputValue] = useState<string>('')

  const [filters, setFilters] = useState<SpeciesFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const [totalCount, setTotalCount] = useState<number>(0)

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  const { data, isLoading, error } = useQuery({
    queryKey: ['enclosure-wise-species', id, filters],
    queryFn: () =>
      getEnclosureWiseSpecies(
        {
          include_sub_enclosure: 1,
          page_no: filters.page,
          limit: filters.pageSize,
          q: filters.search,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder as 'asc' | 'desc' | undefined
        },
        Number(id)
      ),
    enabled: !!id
  })

  const listing: SpeciesRow[] = (data?.data?.listing || []) as unknown as SpeciesRow[]
  const total: number = data?.data?.total_count || data?.data?.total_scies_count || listing.length

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedSpeciesRow[] = useMemo(
    () =>
      listing.map((row, index) => ({
        ...row,
        id: +(row?.taxonomy_id || row?.tsn_id || 0),
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

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const columns: GridColDef[] = [
    {
      width: 90,
      field: 'id',
      headerName: t('s_no') as string,
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
              fontWeight: 500,
              cursor: 'default'
            }}
          >
            {params.row.sl_no}.
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
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left'
          }}
        >
          <SpeciesCard
            species={{
              common_name: params.row.common_name,
              scientific_name: params.row.complete_name,
              default_icon: params.row.default_icon
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
                  justifyContent: 'left',
                  pl: 2
                }}
                onClick={(e: MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation()
                  setDrawerType('animals')
                  setDrawerData({
                    queryKey: 'enclosure-wise-species-drawer',
                    id: id as string,
                    name: params.row.common_name,
                    image: params.row.default_icon,
                    params: {
                      enclosure_id: id,
                      tsn_id: params.row.tsn_id
                    }
                  })
                  setTotalCount(params.row.animal_count || 0)
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
            headerName: t('male') as string,
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
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={params.row.sex_data?.male || 0}
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
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={params.row.sex_data?.female || 0}
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
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={params.row.sex_data?.undetermined || 0}
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
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={params.row.sex_data?.indeterminate || 0}
                  bgcolor={theme.palette.customColors.displaybgSecondary}
                  color={theme.palette.customColors.OnPrimaryContainer}
                />
              </Box>
            )
          }
        ]
      : [])
  ]

  const handleDownload = (): void => {
    console.log('Download button clicked')
  }

  // const handleRowClick = params => {
  //   setOpenDrawer(true)
  //   setDrawerData({
  //     queryKey: 'enclosure-wise-species-drawer',
  //     id: id,
  //     complete_name: params.row.complete_name,
  //     common_name: params.row.common_name,
  //     animal_count: params.row.animal_count,
  //     default_icon: params.row.default_icon,
  //     sex_data: params.row.sex_data,
  //     params: {
  //       enclosure_id: id,
  //       taxonomy_id: params.row.tsn_id
  //     }
  //   })
  // }

  // const handleClose = () => {
  //   setOpenDrawer(false)
  //   setDrawerData(null)
  // }

  return (
    <>
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
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
            // onRowClick={handleRowClick}
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
        <AnimalDrawer totalCount={totalCount} open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
      )}
    </>
  )
}

export default React.memo(EnclosureWiseSpecies)
