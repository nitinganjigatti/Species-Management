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

const Clusters = () => {
  const theme = useTheme()
  const router = useRouter()
  const { query } = router
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const auth = useAuth()
  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  const [serachValue, setSearchValue] = useState('')
  const [downloading, setDownloading] = useState(false)

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)

  const handleClusterInsightClick = () => {
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

  useEffect(() => {
    const { page = '1', pageSize = '10', search = '', sortBy = '', sortOrder = 'asc' } = query

    setFilters({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      sortBy,
      sortOrder
    })

    setSearchValue(search)
  }, [query])

  const { data, isFetching } = useQuery({
    queryKey: ['clusters', filters],
    queryFn: () =>
      getClusterList({
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
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

  const clusterStats = [
    {
      label: 'Species',
      value: statsData?.data?.zoo_stats?.total_species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => console.log('Species')
    },
    {
      label: 'Animals',
      value: statsData?.data?.zoo_stats?.total_animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: () => console.log('Animals')
    },
    {
      label: 'Sections',
      value: statsData?.data?.zoo_stats?.total_sections || 0,
      imagePath: '/images/housing/sections.svg',
      onClick: () => console.log('Sections')
    },

    {
      label: 'Enclosures',
      value: statsData?.data?.zoo_stats?.total_enclosures || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: handleClusterInsightClick
    }
  ]

  const total = data?.data?.total_count || 0
  const clustersList = data?.data?.result || []

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.set(key, value.toString())
      }
    })
    router.replace({ query: params.toString() }, undefined, { shallow: true })
  }

  const handlePaginationModelChange = model => {
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
      debounce(value => {
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
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSortModelChange = sortModel => {
    let updated
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      updated = {
        ...filters,
        sortBy: field,
        sortOrder: sort,
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

  const getSlNo = index => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = clustersList.map((row, index) => ({
    ...row,
    id: +row.cluster_id,
    sl_no: getSlNo(index)
  }))

  const handleHousingClick = () => {
    // router.push('/housing')
  }

  const handleRowClick = params => {
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

  const handleDownload = () => {
    console.log('Downloading...')
  }

  const handleDrawerClose = () => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const columns = [
    {
      width: 90,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
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
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left', pl: 2 }}
        >
          <CellInfo
            value={params.row.cluster_name}
            subtitle={params.row.cluster_desc}
            imgUrl={params.row.images?.[0]?.file}
            avatarUrl=''
            inchargeName=''
          />
        </Box>
      )
    },
    {
      width: 160,
      field: 'species_count',
      headerName: 'Species',
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default', pl: 2 }}
          onClick={e => {
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
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left', pl: 2 }}
          onClick={e => {
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
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left', pl: 2 }}
        >
          <Typography
            sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
          >
            {params.row.site_count || 0}
          </Typography>
        </Box>
      )
    },
    {
      width: 180,
      field: 'incharge',
      headerName: 'In-Charge',
      headerAlign: 'left',
      align: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left', pl: 2 }}
        >
          {RenderUtility.renderUserAvatarDetails(
            params.row.incharge_image,
            params.row.incharge_name,
            '',
            theme.palette.customColors.OnSurfaceVariant,
            '14px'
          )}
        </Box>
      )
    },
    {
      width: 150,
      field: 'actions',
      headerName: 'Actions',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => {
        const phoneNumber = params.row.incharge_mobile_no
        let pressTimer

        const handleLongPress = () => {
          if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            alert('Number copied to clipboard')
          }
        }

        const handleMouseDown = () => {
          pressTimer = setTimeout(handleLongPress, 700)
        }

        const handleMouseUp = () => {
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
            pageTitle={'All Cluster Insights'}
            data={statsData}
            loading={statsFetching}
            error={statsError}
            isListingPage
            statsData={clusterStats}
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
      {drawerType === 'species' && <SpeciesDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
      {drawerType === 'animals' && <AnimalsDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
      {drawerType === 'enclosures' && (
        <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
      )}
    </>
  )
}

export default Clusters
