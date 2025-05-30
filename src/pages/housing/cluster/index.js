import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getClusterList } from 'src/lib/api/housing'
import { CellInfo } from 'src/utility/render'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'

const Clusters = () => {
  const theme = useTheme()
  const router = useRouter()
  const { query } = router

  const [serachValue, setSearchValue] = useState('')
  const [downloading, setDownloading] = useState(false)

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

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

  console.log(data, 'data')

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
    const detailUrl = {
      pathname: `/housing/cluster/${params.row.cluster_id}`,
      query: {
        ...filters
      } // preserve current filters
    }
    router.push(detailUrl)
  }

  const handleDownload = () => {
    console.log('Downloading...')
  }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 250,
      field: 'cluster_name',
      headerName: 'Cluster Name',
      renderCell: params => (
        <CellInfo
          value={params.row.cluster_name}
          subtitle={params.row.cluster_desc}
          imgUrl={params.row.images?.[0]?.file}
          avatarUrl=''
          inchargeName=''
        />
      )
    },
    {
      width: 200,
      field: 'species_count',
      headerName: 'Species',
      renderCell: params => (
        <Typography
          sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}

          // onClick={e => {
          //   e.stopPropagation()
          //   setDrawerType('species')
          //   setDrawerData({
          //     id: params.row.site_id,
          //     name: params.row.site_name,
          //     image: params.row.images?.[0]?.file
          //   })
          // }}
        >
          {params.row.species_count || 0}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'animal_count',
      headerName: 'Animals',
      renderCell: params => (
        <Typography
          sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}

          // onClick={e => {
          //   e.stopPropagation()
          //   setDrawerType('animals')
          //   setDrawerData({
          //     id: params.row.site_id,
          //     name: params.row.site_name,
          //     image: params.row.images?.[0]?.file
          //   })
          // }}
        >
          {params.row.animal_count || 0}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'site_count',
      headerName: 'Sites',
      renderCell: params => (
        <Typography
          sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}

          // onClick={e => {
          //   e.stopPropagation()
          //   setDrawerType('animals')
          //   setDrawerData({
          //     id: params.row.site_id,
          //     name: params.row.site_name,
          //     image: params.row.images?.[0]?.file
          //   })
          // }}
        >
          {params.row.site_count || 0}
        </Typography>
      )
    },
    {
      width: 180,
      field: 'incharge',
      headerName: 'In-Charge',
      sortable: false,
      renderCell: params => (
        <Box display='flex' alignItems='center' width='100%'>
          <UserInfoCard
            avatarUrl={params.row.incharge_image}
            name={params.row.incharge_name}
            textColor={theme.palette.customColors.OnSurfaceVariant}
            fontWeight={500}
            fallbackChar={params.row.incharge_name?.charAt(0)}
          />
        </Box>
      )
    },
    {
      width: 150,
      field: 'actions',
      headerName: 'Actions',
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      renderCell: () => (
        <Box display='flex' justifyContent='center' alignItems='center' gap={3}>
          <Box component='img' src='/images/call.png' alt='Phone' sx={{ width: 20, height: 20, cursor: 'pointer' }} />
          <Box
            component='img'
            src='/images/message.png'
            alt='Message'
            sx={{ width: 20, height: 20, cursor: 'pointer' }}
          />
        </Box>
      )
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
          <InsightsCard pageTitle={'All Cluster Insights'} />
          <Box sx={{ mt: 6 }}>
            <Card sx={{ p: { xs: 3, md: 5 } }}>
              <ListingHeader title='All Clusters' totalCount={total} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <Search
                    value={serachValue}
                    onChange={e => handleSearch(e.target.value)}
                    onClear={() => handleSearch('')}
                    placeholder='Search…'
                    sx={{ justifyContent: 'flex-end' }}
                  />
                  <ExportButton loading={downloading} onClick={handleDownload} />
                </Box>
                <Grid
                  sx={{
                    '& .MuiDataGrid-cell': { pt: 4, py: 4, px: 4 },
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
    </>
  )
}

export default Clusters
