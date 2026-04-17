import { useTheme } from '@emotion/react'
import { Box, debounce, Grid, Typography, Theme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAllSites } from 'src/lib/api/housing'
import RenderUtility, { CellInfo } from 'src/utility/render'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { SiteFilters, IndexedSiteRow, Site, SortOrder } from 'src/types/housing'
import { GridRowParams, GridSortModel } from '@mui/x-data-grid'

interface PaginationModel {
  page: number
  pageSize: number
}

const ClusterIncharges: React.FC = () => {
  const { t } = useTranslation()
  const router = useSafeRouter()
  const { id } = router.query
  const theme = useTheme() as Theme

  const [downloading, setDownloading] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')

  const [filters, setFilters] = useState<SiteFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const { data, isFetching } = useQuery({
    queryKey: ['clustersites', id, filters],
    queryFn: () =>
      getAllSites({
        cluster_id: Number(id),
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }),
    enabled: !!id
  })

  const sitesListing: Site[] = data?.data?.result || []
  console.log('Site >>', sitesListing)
  const total: number = data?.data?.total_count || 0

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedSiteRow[] = sitesListing.map((row, index) => ({
    ...row,
    id: +row?.site_id,
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

  // useEffect(() => {
  //   return () => debouncedSearch.cancel()
  // }, [debouncedSearch])

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
    router.push(`/housing/sites/${(params.row as IndexedSiteRow).site_id}`)
  }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: t('s_no'),
      renderCell: (params: any) => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 250,
      field: 'site_name',
      headerName: t('housing_module.site_name'),
      renderCell: (params: any) => (
        <CellInfo
          value={params.row.site_name}
          subtitle={''}
          color={(theme.palette.primary as any).OnSurface}
          subtitleColor={(theme.palette as any).customColors?.OnSurfaceVariant}
          imgUrl={params.row.images?.[0]?.file}
          avatarUrl={''}
          inchagename={''}
          defaultImage={'/images/housing/site_icon_round.svg'}
          defaultImageAlt={'site'}
        />
      )
    },
    {
      width: 200,
      field: 'species',
      headerName: t('species'),
      renderCell: (params: any) => (
        <Typography sx={{ color: (theme.palette.primary as any).OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.species_count || 0}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'animals',
      headerName: t('animals'),
      renderCell: (params: any) => (
        <Typography sx={{ color: (theme.palette.primary as any).OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.animal_count || 0}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'enclosures',
      headerName: t('enclosures'),
      renderCell: (params: any) => (
        <Typography sx={{ color: (theme.palette.primary as any).OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.enclosure_count}
        </Typography>
      )
    },
    {
      width: 180,
      field: 'incharge',
      headerName: t('in_charge'),
      renderCell: (params: any) => (
        <UserAvatarDetails
          profile_image={params.row?.incharge_image}
          user_name={params.row?.incharge_name}
        />
      )
    },
    {
      width: 150,
      field: 'actions',
      headerName: t('actions'),
      align: 'center' as const,
      renderCell: (params: any) => (
        <>
          {params.row.incharge_name ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Box
                component='img'
                src='/images/call.png'
                alt='Phone'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
              />
              <Box
                component='img'
                src='/images/message.png'
                alt='Message'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
              />
            </Box>
          ) : (
            '-'
          )}
        </>
      )
    }
  ]

  return (
    <>
      <ListingHeader title={t('housing_module.all_sites')} totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
          <Search
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder={t('search') as string}
            sx={{ justifyContent: 'flex-end' }}
          />
          <ExportButton loading={downloading} onClick={handleDownload} bgcolor={theme.palette.primary.main} />
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
              fontWeight: 600
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
    </>
  )
}

export default ClusterIncharges
