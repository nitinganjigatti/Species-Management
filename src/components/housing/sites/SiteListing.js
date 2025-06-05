import { useTheme } from '@emotion/react'
import { Box, CircularProgress, Grid, Typography, useMediaQuery } from '@mui/material'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import debounce from 'lodash/debounce'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { useRouter } from 'next/router'
import { ExportButton } from 'src/views/utility/render-snippets'
import RenderUtility, { CellInfo } from 'src/utility/render'
import SectionsDrawer from '../utils/SectionsDrawer'
import SpeciesDrawer from 'src/components/housing/utils/SpeciesDrawer'
import AnimalsDrawer from 'src/components/housing/utils/AnimalDrawer'
import { getAllSites } from 'src/lib/api/housing'
import EnclosureDrawer from '../utils/EnclosureDrawer'
import { useAuth } from 'src/hooks/useAuth'

const Listing = () => {
  const theme = useTheme()
  const router = useRouter()
  const auth = useAuth()
  const { query } = router

  const [inputValue, setInputValue] = useState('')

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const [drawerType, setDrawerType] = useState(null)
  const [drawerData, setDrawerData] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const zooId = auth?.userData?.user?.zoos?.[0]?.zoo_id

  // Populate filters from query string on mount
  useEffect(() => {
    const { page = '1', pageSize = '10', search = '', sortBy = '', sortOrder = 'asc' } = query

    setFilters({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      sortBy,
      sortOrder
    })

    setInputValue(search)
  }, [query])

  const { data, isFetching } = useQuery({
    queryKey: ['sites', filters],
    queryFn: () =>
      getAllSites({
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      })
  })

  const total = data?.data?.total_count || 0
  const siteList = data?.data?.result || []

  useEffect(() => {
    if (siteList.length === 1) {
      router.replace({
        pathname: `/housing/sites/${siteList[0].site_id}`,
        query: { ...filters }
      })
    }
  }, [siteList, router])

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
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
      setInputValue(value)
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

  const indexedRows = siteList.map((row, index) => ({
    ...row,
    id: +row.site_id,
    sl_no: getSlNo(index)
  }))

  const handleRowClick = params => {
    if (
      params.field !== 'actions' &&
      params.field !== 'id' &&
      params.field !== 'species' &&
      params.field !== 'animals' &&
      params.field !== 'sections' &&
      params.field !== 'enclosures' &&
      params.field !== 'incharge'
    ) {
      const detailUrl = {
        pathname: `/housing/sites/${params.row.site_id}`,
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
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },

    {
      width: 300,
      field: 'site_name',
      align: 'left',
      headerName: 'Site Name',
      sortable: false,
      renderCell: params => (
        <CellInfo
          value={params.row.site_name}
          subtitle=''
          imgUrl={params.row.images?.[0]?.file}
          avatarUrl=''
          inchargeName=''
        />
      )
    },
    {
      width: 150,
      field: 'species',
      headerName: 'Species',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={e => {
            e.stopPropagation()
            setDrawerType('species')
            setDrawerData({
              queryKey: 'site-species-drawer',
              id: params.row.site_id,
              name: params.row.site_name,
              image: params.row.images?.[0]?.file,
              params: {
                site_id: params.row.site_id
              }
            })
          }}
        >
          <Typography
            sx={{
              color: theme.palette.primary.OnSurface,
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {params.row.species_count || 0}
          </Typography>
        </Box>
      )
    },
    {
      width: 150,
      field: 'animals',
      headerName: 'Animals',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={e => {
            e.stopPropagation()
            setDrawerType('animals')
            setDrawerData({
              queryKey: 'site-animals-drawer',
              id: params.row.site_id,
              name: params.row.site_name,
              image: params.row.images?.[0]?.file,
              params: {
                site_id: params.row.site_id
              }
            })
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
      width: 150,
      field: 'sections',
      headerName: 'Sections',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={e => {
            e.stopPropagation()
            setDrawerType('sections')
            setDrawerData({
              queryKey: 'site-sections-drawer',
              id: params.row?.site_id,
              name: params.row?.site_name,
              image: params.row?.images?.[0]?.file,
              params: {
                site_id: params.row?.site_id
              }
            })
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '16px',
              color: theme.palette.primary.OnSurface
            }}
          >
            {params.row.section_count}
          </Typography>
        </Box>
      )
    },
    {
      width: 150,
      field: 'enclosures',
      headerName: 'Enclosures',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center'

            // cursor: 'pointer'
          }}
          onClick={e => {
            e.stopPropagation()

            // setDrawerType('enclosures')
            // setDrawerData({
            //   queryKey: 'site-enclosures-insights-drawer',
            //   id: params.row?.site_id,
            //   name: params.row?.site_name,
            //   image: params.row?.images?.[0]?.file,
            //   params: {
            //     ref_type: 'zoo',
            //     data_type: 'enclosure',
            //     ref_id: zooId,
            //     site_id: params.row?.site_id
            //   }
            // })
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '16px',
              color: theme.palette.primary.OnSurface
            }}
          >
            {params.row.enclosure_count}
          </Typography>
        </Box>
      )
    },

    {
      width: 180,
      field: 'incharge',
      headerName: 'In-Charge',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params =>
        RenderUtility.renderUserAvatarDetails(
          params.row.incharge_image,
          params.row.incharge_name,
          '',
          theme.palette.customColors.OnSurfaceVariant,
          '14px'
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
        if (!isSmallScreen) {
          // Show mobile number on small and extra small devices
          return (
            <Typography sx={{ fontSize: '14px', fontWeight: 500, cursor: 'default' }}>
              {params.row.incharge_mobile_no || '-'}
            </Typography>
          )
        } else {
          // Show phone icon on larger devices
          return (
            <>
              {params.row.incharge_mobile_no ? (
                <Box
                  component='img'
                  src='/images/call.png'
                  alt='Phone'
                  sx={{ width: 20, height: 20, cursor: 'pointer' }}
                  onClick={() => {
                    // window.open(`tel:${params.row.incharge_mobile_no}`)
                    console.log(`Calling ${params.row.incharge_mobile_no}`)
                  }}
                />
              ) : (
                '-'
              )}
            </>
          )
        }
      }
    }
  ]

  if (siteList.length === 1) {
    // Loader while redirecting to details page
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
        <ListingHeader title='All Sites' totalCount={total} />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
            <Search
              value={inputValue}
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
              placeholder='Search…'
              sx={{ justifyContent: 'flex-end' }}
            />
            {/* <ExportButton loading={downloading} onClick={handleDownload} /> */}
          </Box>
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

        {drawerType === 'sections' && (
          <SectionsDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
        )}
        {drawerType === 'species' && (
          <SpeciesDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
        )}
        {drawerType === 'animals' && (
          <AnimalsDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
        )}
        {drawerType === 'enclosures' && (
          <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
        )}
      </>
  )
}

export default React.memo(Listing)
