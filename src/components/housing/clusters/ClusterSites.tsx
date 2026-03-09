import { useTheme } from '@emotion/react'
import { Box, debounce, Grid, Typography, useMediaQuery, Theme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'
import { getAllSites } from 'src/lib/api/housing'
import RenderUtility, { CellInfo } from 'src/utility/render'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import SpeciesDrawer from '../utils/SpeciesDrawer'
import AnimalDrawer from '../utils/AnimalDrawer'
import EnclosureDrawer from '../utils/EnclosureDrawer'
import { useAuth } from 'src/hooks/useAuth'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { SiteFilters, IndexedSiteRow, Site, DrawerData, DrawerType, SortOrder } from 'src/types/housing'
import { GridCellParams, GridSortModel } from '@mui/x-data-grid'

interface ClusterSitesProps {
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
}

interface PaginationModel {
  page: number
  pageSize: number
}

const ClusterSites: React.FC<ClusterSitesProps> = ({ drawerType, setDrawerType, drawerData, setDrawerData }) => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme() as Theme
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const [downloading, setDownloading] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')

  const [filters, setFilters] = useState<SiteFilters>({
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

  const handleRowClick = (params: GridCellParams): void => {
    if (
      params?.field !== 'id' &&
      params?.field !== 'species' &&
      params?.field !== 'species' &&
      params?.field !== 'animals' &&
      params?.field !== 'enclosures' &&
      params?.field !== 'incharge'
    ) {
      const detailUrl = {
        pathname: `/housing/sites/${(params.row as IndexedSiteRow).id}`,
        query: {
          ...filters
        }
      }
      router.push(detailUrl)
    }
  }

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
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
            {parseInt((params.row as IndexedSiteRow).sl_no.toString()) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 300,
      field: 'site_name',
      headerName: 'Site Name',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <CellInfo
          value={(params.row as IndexedSiteRow).site_name}
          subtitle={''}
          color={(theme.palette.primary as any).OnSurface}
          subtitleColor={(theme.palette as any).customColors?.OnSurfaceVariant}
          imgUrl={(params.row as IndexedSiteRow).images?.[0]?.file}
          defaultImage={'/images/housing/site-icon-colored.svg'}
          defaultImageAlt={'site'}
          avatarUrl={''}
          inchagename={''}
        />
      )
    },
    ...(insightsViewAccess
      ? [
          {
            width: 160,
            field: 'species',
            headerName: 'Species',
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
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('species')
                  setDrawerData({
                    queryKey: 'cluster-details-species-drawer',
                    id: (params.row as IndexedSiteRow).site_id,
                    name: (params.row as IndexedSiteRow).site_name,
                    image: (params.row as IndexedSiteRow).images?.[0]?.file,
                    params: {
                      site_id: (params.row as IndexedSiteRow).site_id
                    }
                  })
                }}
              >
                <Typography
                  sx={{
                    color: (theme.palette.primary as any).OnSurface,
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {(params.row as IndexedSiteRow).species_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'animals',
            headerName: 'Animals',
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
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('animals')
                  setDrawerData({
                    queryKey: 'cluster-details-animals-drawer',
                    id: (params.row as IndexedSiteRow).site_id,
                    name: (params.row as IndexedSiteRow).site_name,
                    image: (params.row as IndexedSiteRow).images?.[0]?.file,
                    params: {
                      site_id: (params.row as IndexedSiteRow).site_id
                    }
                  })
                  setTotalCount((params.row as IndexedSiteRow).animal_count || 0)
                }}
              >
                <Typography
                  sx={{
                    color: (theme.palette.primary as any).OnSurface,
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {(params.row as IndexedSiteRow).animal_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'enclosures',
            align: 'left' as const,
            headerAlign: 'left' as const,
            headerName: 'Enclosures',
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'default'
                }}

                // onClick={e => {
                //   e.stopPropagation()

                //   setDrawerType('enclosures')
                //   setDrawerData({
                //     queryKey: 'cluster-details-enclosures-drawer',
                //     id: params.row.site_id,
                //     name: params.row.site_name,
                //     image: params.row.images?.[0]?.file,
                //     params: {
                //       site_id: params.row.site_id
                //     }
                //   })
                // }}
              >
                <Typography
                  sx={{
                    color: (theme.palette.primary as any).OnSurface,
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {(params.row as IndexedSiteRow).enclosure_count || 0}
                </Typography>
              </Box>
            )
          }
        ]
      : []),
    {
      width: 200,
      field: 'incharge',
      headerName: 'In-Charge',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <UserAvatarDetails profile_image={(params.row as IndexedSiteRow)?.incharge_image} user_name={(params.row as IndexedSiteRow)?.incharge_name} />
      )
    },
    {
      width: 150,
      field: 'actions',
      headerName: 'Actions',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const phoneNumber = (params.row as IndexedSiteRow).incharge_mobile_no
        let pressTimer: NodeJS.Timeout

        const handleLongPress = (): void => {
          if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            alert('Number copied to clipboard')
          }
        }

        const handleMouseDown = (): void => {
          pressTimer = setTimeout(handleLongPress, 700)
        }

        const handleMouseUp = (): void => {
          clearTimeout(pressTimer)
        }

        return isSmallScreen ? (
          phoneNumber ? (
            <Box
              sx={{
                display: 'flex',
                gap: 4
              }}
            >
              {/* Call Icon */}
              <Box
                component='img'
                src='/images/call.png'
                alt='Call'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
                onClick={() => window.open(`tel:${phoneNumber}`)}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              />
              {/* Message Icon */}
              <Box
                component='img'
                src='/images/message.png' // <-- Replace with your message icon path
                alt='Message'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
                onClick={() => window.open(`sms:${phoneNumber}`)}
              />
            </Box>
          ) : (
            '-'
          )
        ) : (
          <Typography sx={{ fontSize: '14px', fontWeight: 500, cursor: 'default' }}>{phoneNumber || '-'}</Typography>
        )
      }
    }
  ]

  return (
    <>
      <ListingHeader title='All Sites' totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
          <Search
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
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
            loading={isFetching}
            searchValue=''
            maxHeight='80vh'
          />
        </Grid>
      </Box>
      {drawerType === 'species' && <SpeciesDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
      {drawerType === 'animals' && (
        <AnimalDrawer
          totalCount={totalCount}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData}
          defaultImage={'/images/housing/site-icon-colored.svg'}
        />
      )}
      {drawerType === 'enclosures' && (
        <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
      )}
    </>
  )
}

export default ClusterSites
