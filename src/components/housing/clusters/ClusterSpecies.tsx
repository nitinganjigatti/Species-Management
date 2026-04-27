import { useTheme } from '@emotion/react'
import { Box, debounce, Grid, Typography, Theme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAllSpeciesList } from 'src/lib/api/housing'
import RenderUtility, { CellInfo, GenderInfoCard } from 'src/utility/render'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import AnimalDrawer from '../utils/AnimalDrawer'
import { useAuth } from 'src/hooks/useAuth'
import { SpeciesFilters, IndexedSpeciesRow, Species, DrawerData, SortOrder } from 'src/types/housing'
import { GridRowParams, GridSortModel, GridCellParams } from '@mui/x-data-grid'

interface SpeciesListItem extends Species {
  tsn_id: number
  complete_name?: string
  common_name?: string
  sex_data?: {
    male?: number
    female?: number
    undetermined?: number
    indeterminate?: number
  }
}

interface IndexedSpeciesListRow extends SpeciesListItem {
  id: number
  sl_no: number
}

interface AnimalDrawerData extends DrawerData {
  complete_name?: string
  common_name?: string
  animal_count?: number
  default_icon?: string
  sex_data?: {
    male?: number
    female?: number
    undetermined?: number
    indeterminate?: number
  }
}

interface PaginationModel {
  page: number
  pageSize: number
}

const ClusterSpecies: React.FC = () => {
  const { t } = useTranslation()
  const router = useSafeRouter()
  const { id } = router.query
  const theme = useTheme() as Theme

  const [downloading, setDownloading] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [drawerData, setDrawerData] = useState<AnimalDrawerData | null>(null)

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

  const { data, isFetching } = useQuery({
    queryKey: ['clusterspecies', id, filters],
    queryFn: () =>
      getAllSpeciesList({
        cluster_id: Number(id),
        page_no: filters.page,
        limit: filters.pageSize,
        search: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }),
    enabled: !!id
  })

  const speciesListing: SpeciesListItem[] = (data?.data?.listing || []) as SpeciesListItem[]
  const total: number = data?.data?.total_scies_count || 0

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedSpeciesListRow[] = speciesListing.map((row, index) => ({
    ...row,
    id: +row?.tsn_id,
    sl_no: getSlNo(index)
  }))

  const handlePaginationModelChange = (model: PaginationModel): void => {
    const newPage = model.page + 1
    const newPageSize = model.pageSize

    if (newPage !== filters.page || newPageSize !== filters.pageSize) {
      setFilters(prev => ({
        ...prev,
        page: newPage,
        pageSize: newPageSize
      }))
    }
  }

  const handleSortModelChange = (sortModel: GridSortModel): void => {
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: sort as SortOrder,
        page: 1
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: '',
        sortOrder: 'asc'
      }))
    }
  }

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
    return () => debouncedSearch.clear()
  }, [debouncedSearch])

  const handleSearch = (value: string): void => {
    setInputValue(value)
    debouncedSearch(value)
  }

  const handleDownload = (): void => {
    if (!indexedRows || indexedRows.length === 0) return

    setDownloading(true)

    const csvHeader = ['SL.NO', 'Section Name', 'Species Count', 'Animal Count', 'Enclosure Count', 'In-Charge']

    const csvRows = indexedRows.map(row => [
      row.sl_no,
      `"${(row as any).section_name}"`,
      (row as any).species_count || 0,
      (row as any).animal_count || 0,
      (row as any).enclosure_count || 0,
      `"${(row as any).incharge_name || '-'}"`
    ])

    const csvContent = [csvHeader.join(','), ...csvRows.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `sections_export_${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setDownloading(false)
  }

  const handleRowClick = (params: GridRowParams): void => {
    const row = params.row as IndexedSpeciesListRow
    setOpenDrawer(true)
    setDrawerData({
      queryKey: 'cluster-animals-drawer',
      id: id as string,
      complete_name: row?.complete_name,
      common_name: row?.common_name,
      animal_count: row?.animal_count,
      default_icon: row?.default_icon,
      sex_data: row?.sex_data,
      name: row?.common_name || row?.complete_name || '',
      params: {
        id: id,
        tsn_id: row.tsn_id,
        cluster_id: id
      }
    })
    setTotalCount(row?.animal_count || 0)
  }

  const handleClose = (): void => {
    setOpenDrawer(false)
    setDrawerData(null)
  }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: t('s_no'),
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: 'default',
            justifyContent: 'left'
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
            {(params.row as IndexedSpeciesListRow).sl_no}.
          </Typography>
        </Box>
      )
    },
    {
      width: 280,
      field: 'common_name',
      headerAlign: 'left' as const,
      sortable: false,
      headerName: t('species'),
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: 'default',
            justifyContent: 'left'
          }}
        >
          <SpeciesCard
            species={{
              common_name: (params.row as IndexedSpeciesListRow).common_name,
              scientific_name: (params.row as IndexedSpeciesListRow).complete_name,
              default_icon: (params.row as IndexedSpeciesListRow).default_icon
            }}
          />
        </Box>
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
            cursor: 'pointer',
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'default',
                  justifyContent: 'left'
                }}
              >
                <Typography
                  sx={{ color: (theme.palette.primary as any).OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
                >
                  {(params.row as IndexedSpeciesListRow).animal_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 160,
            field: 'male',
            headerName: t('male'),
            headerAlign: 'left' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <GenderInfoCard
                value={(params.row as IndexedSpeciesListRow).sex_data?.male || 0}
                bgcolor={`${theme.palette.customColors.SecondaryContainer}80`}
                color={theme.palette.customColors.addPrimary}
              />
            )
          },
          {
            width: 160,
            field: 'female',
            headerName: t('female'),
            align: 'left' as const,
            headerAlign: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <GenderInfoCard
                value={(params.row as IndexedSpeciesListRow).sex_data?.female || 0}
                bgcolor={`${theme.palette.customColors.customDropdownColor}4D`}
                color={theme.palette.customColors.customDropdownColor}
              />
            )
          },
          {
            width: 160,
            field: 'undetermined',
            headerName: t('housing_module.undetermined'),
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
                  cursor: 'default',
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={(params.row as IndexedSpeciesListRow).sex_data?.undetermined || 0}
                  bgcolor={theme.palette.customColors.SurfaceVariant}
                  color={theme.palette.customColors.Error}
                />
              </Box>
            )
          },
          {
            flex: 1,
            minWidth: 160,
            field: 'indeterminate',
            align: 'left' as const,
            headerAlign: 'left' as const,
            headerName: t('housing_module.indeterminate'),
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'default',
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={(params.row as IndexedSpeciesListRow).sex_data?.indeterminate || 0}
                  bgcolor={theme.palette.customColors.displaybgSecondary}
                  color={theme.palette.customColors.OnPrimaryContainer}
                />
              </Box>
            )
          }
        ]
      : [])

    // {
    //   width: 160,
    //   field: 'actions',
    //   headerName: 'Actions',
    //   align: 'center',
    //   sortable: false,
    //   headerAlign: 'center',
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
              py: 4,
              px: 4
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
            onRowClick={handleRowClick}
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
            loading={isFetching}
            searchValue=''
            maxHeight='80vh'
          />
        </Grid>
      </Box>
      {openDrawer && <AnimalDrawer totalCount={totalCount} open={!!drawerData} onClose={handleClose} data={drawerData} />}
    </>
  )
}

export default ClusterSpecies
