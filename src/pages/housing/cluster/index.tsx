import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Grid, Typography, useMediaQuery } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import SpeciesDrawer from 'src/components/housing/utils/SpeciesDrawer'
import AnimalsDrawer from 'src/components/housing/utils/AnimalDrawer'
import { useAuth } from 'src/hooks/useAuth'
import { getClusterList, getSiteAnalytics } from 'src/lib/api/housing'
import RenderUtility, { CellInfo } from 'src/utility/render'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import EnclosureDrawer from 'src/components/housing/utils/EnclosureDrawer'
import AddCluster from 'src/views/pages/housing/AddCluster/AddCluster'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import Error404 from 'src/pages/404'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { GridCellParams, GridSortModel } from '@mui/x-data-grid'

interface Filters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: string
}

interface DrawerData {
  queryKey: string
  id: string | undefined
  name?: string
  image?: string
  params: Record<string, any>
}

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

interface PaginationModel {
  page: number
  pageSize: number
}

interface ClusterRow {
  cluster_id: string
  cluster_name: string
  cluster_desc?: string
  images?: Array<{ file: string }>
  species_count?: number
  animal_count?: number
  site_count?: number
  incharge_name?: string
  incharge_image?: string
  incharge_mobile_no?: string
}

interface IndexedRow extends ClusterRow {
  id: number
  sl_no: number
}

const Clusters: React.FC = () => {
  const theme = useTheme() as any
  const router = useRouter()
  const { query } = router
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const auth = useAuth()
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  const hasClusterAddAccess =
    (auth as any)?.userData?.roles?.settings?.manage_cluster_permission === 'ADD' ||
    (auth as any)?.userData?.roles?.settings?.manage_cluster_permission === 'EDIT' ||
    (auth as any)?.userData?.roles?.settings?.manage_cluster_permission === 'DELETE'

  const [serachValue, setSearchValue] = useState<string>('')
  const [downloading, setDownloading] = useState<boolean>(false)

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [showDrawer, setShowDrawer] = useState<boolean>(false)
  const [totalAnimalCount, setTotalAnimalCount] = useState<number>(0)

  const handleClusterInsightClick = (): void => {
    setDrawerType('enclosures')
    setDrawerData({
      queryKey: 'insights-enclosures-cluster-drawer',

      id: zooId,

      // name: params.row?.site_name,
      // image: params.row?.images?.[0]?.file,
      params: {
        ref_type: 'zoo',
        data_type: 'enclosure',
        ref_id: zooId

        // site_id: params.row?.site_id
      }
    })
  }

  const handleClusterAnimalsInsightClick = (): void => {
    setDrawerType('insights-animals')
    setDrawerData({
      queryKey: 'insights-animals-sites-drawer',
      id: zooId,
      params: {
        ref_type: 'zoo',
        data_type: 'animal',
        ref_id: zooId
      }
    })
  }

  useEffect(() => {
    const { page = '1', pageSize = '10', search = '', sortBy = '', sortOrder = 'asc' } = query as Record<string, string>

    setFilters({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      sortBy,
      sortOrder
    })

    setSearchValue(search)
  }, [query])

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['clusters', filters],
    queryFn: () =>
      getClusterList({
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder as 'asc' | 'desc' | undefined
      })
  })

  const {
    data: statsData,
    isFetching: statsFetching,
    error: statsError
  } = useQuery({
    queryKey: ['clusters-insights', zooId],
    queryFn: () => getSiteAnalytics(zooId),
    enabled: !!zooId
  })

  const zooStats = (statsData?.data as any)?.zoo_stats
  const clusterStats: StatItem[] = [
    {
      label: 'Species',
      value: zooStats?.total_species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => console.log('Species')
    },
    {
      label: 'Animals',
      value: zooStats?.total_animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleClusterAnimalsInsightClick
    },
    {
      label: 'Sections',
      value: zooStats?.total_sections || 0,
      imagePath: '/images/housing/sections.svg',
      onClick: () => console.log('Sections')
    },

    {
      label: 'Enclosures',
      value: zooStats?.total_enclosures || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: handleClusterInsightClick
    }
  ]

  const total = data?.data?.total_count || 0
  const clustersList = (data?.data?.result || []) as unknown as ClusterRow[]

  const updateUrlParams = (updatedFilters: Filters): void => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.set(key, value.toString())
      }
    })
    router.replace({ query: params.toString() }, undefined, { shallow: true })
  }

  const handlePaginationModelChange = (model: PaginationModel): void => {
    const updated = {
      ...filters,
      page: model.page + 1,
      pageSize: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        const updated = {
          ...filters,
          search: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters]
  )

  const handleSearch = useCallback(
    (value: string): void => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSortModelChange = (sortModel: GridSortModel): void => {
    let updated: Filters
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      updated = {
        ...filters,
        sortBy: field,
        sortOrder: sort || 'asc',
        page: 1
      }
    } else {
      updated = {
        ...filters,
        sortBy: '',
        sortOrder: 'asc'
      }
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedRow[] = clustersList.map((row, index) => ({
    ...row,
    id: +row.cluster_id,
    sl_no: getSlNo(index)
  }))

  const handleHousingClick = (): void => {
    // router.push('/housing')
  }

  const handleRowClick = (params: GridCellParams): void => {
    if (
      params.field !== 'id' &&
      params?.field !== 'actions' &&
      params?.field !== 'species_count' &&
      params?.field !== 'animal_count' &&
      params?.field !== 'site_count' &&
      params?.field !== 'incharge'
    ) {
      const detailUrl = {
        pathname: `/housing/cluster/${params.row.cluster_id}`,
        query: {
          ...filters
        } // preserve current filters
      }
      router.push(detailUrl)
    }
  }

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
      headerName: 'SL.NO',
      sortable: false,
      align: 'left' as const,
      headerAlign: 'left' as const,
      renderCell: (params: GridCellParams) => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
          <Typography
            sx={{
              color: theme.palette.customColors.neutralSecondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'default'
            }}
          >
            {parseInt(params.row.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 280,
      field: 'cluster_name',
      headerName: 'Cluster Name',
      headerAlign: 'left' as const,
      align: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left', pl: 2 }}
        >
          <CellInfo
            value={params.row.cluster_name}
            subtitle={params.row.cluster_desc}
            imgUrl={params.row.images?.[0]?.file}
            defaultImage={'/images/housing/site-icon-colored.svg'}
            defaultImageAlt=""
            avatarUrl=""
            inchagename=""
            color={(theme.palette as any)?.customColors?.OnSurfaceVariant}
            subtitleColor={(theme.palette as any)?.customColors?.secondaryBg}
          />
        </Box>
      )
    },
    ...(insightsViewAccess
      ? [
          {
            width: 160,
            field: 'species_count',
            headerName: 'Species',
            headerAlign: 'left' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  color: theme.palette.primary.OnSurface,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'default',
                  pl: 2
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('species')
                  setDrawerData({
                    queryKey: 'cluster-species-drawer',
                    id: params.row.cluster_id,
                    name: params.row.cluster_name,
                    image: params.row.images?.[0]?.file,
                    params: {
                      cluster_id: params.row.cluster_id
                    }
                  })
                }}
              >
                <Typography
                  sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
                >
                  {params.row.species_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'animal_count',
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
                  justifyContent: 'left',
                  pl: 2
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('animals')
                  setDrawerData({
                    queryKey: 'cluster-animal-drawer',
                    id: params.row.cluster_id,
                    name: params.row.cluster_name,
                    image: params.row.images?.[0]?.file,
                    params: {
                      cluster_id: params.row.cluster_id
                    }
                  })
                  setTotalAnimalCount(params.row.animal_count || 0)
                }}
              >
                <Typography
                  sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
                >
                  {params.row.animal_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'site_count',
            headerName: 'Sites',
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
                  pl: 2
                }}
              >
                <Typography
                  sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
                >
                  {params.row.site_count || 0}
                </Typography>
              </Box>
            )
          }
        ]
      : []),
    {
      width: 180,
      field: 'incharge',
      headerName: 'In-Charge',
      headerAlign: 'left' as const,
      align: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left', pl: 2 }}
        >
          <UserAvatarDetails profile_image={params.row?.incharge_image} user_name={params.row?.incharge_name} />
        </Box>
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
        const phoneNumber = params.row.incharge_mobile_no
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
              display='flex'
              gap={4}
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'left',
                pl: 2
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

  if ((auth as any)?.userData?.roles?.settings?.manage_cluster_permission === '') {
    return <Error404 />
  }

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
            Housing
          </Typography>

          <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
            Cluster List
          </Typography>
        </Breadcrumbs>
        <Box>
          <InsightsCard
            pageTitle={'All Sites Insights'}
            data={statsData as any}
            loading={statsFetching}
            haveInsightsViewAccess={insightsViewAccess}
            error={statsError}
            isListingPage
            statsData={clusterStats as any}
            actions={{
              onAddNew: hasClusterAddAccess ? () => setShowDrawer(true) : null
            }}
            onCallClick={() => {}}
            onMessageClick={() => {}}
            zooName=""
            subtitle=""
            userName=""
            image=""
            userImage=""
            description=""
          />
          <Box sx={{ mt: 6 }}>
            <Card sx={{ p: { xs: 3, md: 5 } }}>
              <ListingHeader title='All Clusters' totalCount={total} />
              <Box>
                {/* <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}
                >
                  <Search
                    value={serachValue}
                    onChange={e => handleSearch(e.target.value)}
                    onClear={() => handleSearch('')}
                    placeholder='Search…'
                    sx={{ justifyContent: 'flex-end' }}
                  />
                  <ExportButton loading={downloading} onClick={handleDownload} />
                </Box> */}
                <Grid
                  sx={{
                    '& .MuiDataGrid-cell': { pt: 4, py: 4, px: 4 },
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
                    paginationModel={{ page: filters.page - 1, pageSize: filters.pageSize }}
                    setPaginationModel={handlePaginationModelChange}
                    handleSortModel={handleSortModelChange}
                    loading={isFetching}
                    searchValue=''
                    maxHeight='80vh'
                  />
                </Grid>
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>
      {drawerType === 'species' && <SpeciesDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData as any} />}
      {drawerType === 'animals' && (
        <AnimalsDrawer
          totalCount={totalAnimalCount}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData as any}
          defaultImage={'/images/housing/cluster-icon-colored.svg'}
        />
      )}
      {drawerType === 'insights-animals' && (
        <AnimalsDrawer
          totalCount={zooStats?.total_animals || 0}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData as any}
          defaultImage={'/images/housing/site-icon-colored.svg'}
        />
      )}
      {drawerType === 'enclosures' && (
        <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData as any} />
      )}
      {showDrawer && <AddCluster open={showDrawer} setShowDrawer={setShowDrawer} refetchCluster={refetch} />}
    </>
  )
}

export default enforceModuleAccess(Clusters, 'enable_housing_in_web')
