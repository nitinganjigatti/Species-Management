import { useTheme } from '@emotion/react'
import { Avatar, Box, Grid, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import debounce from 'lodash/debounce'
import { useDispatch, useSelector } from 'react-redux'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import { fetchSites, setParams } from 'src/store/slices/housing/sitesSlice'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import ListingHeader from '../../views/pages/housing/utils/ListingHeader'
import { useRouter } from 'next/router'
import { ExportButton } from 'src/views/utility/render-snippets'
import { CellInfo } from 'src/utility/render'

const Listing = () => {
  const [downloading, setDownloading] = useState(false)

  const router = useRouter()
  const theme = useTheme()
  const dispatch = useDispatch()

  const {
    list: siteList,
    loading,
    total,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search
  } = useSelector(state => state.sites)

  // Debounced fetchSites call whenever parameters change
  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchSites())
    }, 500),
    [dispatch, page, pageSize, sortBy, sortOrder, search]
  )

  useEffect(() => {
    debouncedFetch()

    return () => debouncedFetch.cancel()
  }, [debouncedFetch])

  const handlePaginationModelChange = model => {
    const newPage = model.page + 1
    const newPageSize = model.pageSize

    if (newPage !== page || newPageSize !== pageSize) {
      dispatch(setParams({ page: newPage, pageSize: newPageSize }))
    }
  }

  const handleSearch = useCallback(
    value => {
      dispatch(setParams({ search: value, page: 1 }))
    },
    [dispatch]
  )

  const handleSortModelChange = sortModel => {
    console.log('sortModel', sortModel)
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      dispatch(setParams({ sortBy: field, sortOrder: sort, page: 1 }))
    } else {
      dispatch(setParams({ sortBy: '', sortOrder: '' }))
    }
  }

  const handleDownload = () => {
    console.log('Downloading...')
  }

  const getSlNo = index => (page - 1) * pageSize + index + 1

  const indexedRows = siteList?.map((row, index) => ({
    ...row,
    id: +row?.site_id, // convert string to number
    sl_no: getSlNo(index)
  }))

  const handleRowClick = params => {
    router.push({
      pathname: `/housing/sites/${params.row.site_id}`
    })
  }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 250,
      field: 'site_name',
      headerName: 'Site Name',
      renderCell: params => (
        <CellInfo value={params.row.site_name} subtitle={''} imgUrl={params.row.images?.[0]?.file} avatarUrl={''} />
      )
    },
    {
      width: 200,
      field: 'species',
      headerName: 'Species',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.species_count || 0}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'animals',
      headerName: 'Animals',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.animal_count || 0}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'enclosures',
      headerName: 'Enclosures',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.enclosure_count}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'sections',
      headerName: 'Sections',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.section_count}
        </Typography>
      )
    },
    {
      width: 180,
      field: 'incharge',
      headerName: 'In-Charge',
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
      align: 'center',
      headerAlign: 'center',
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
      <ListingHeader title='All Sites' totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <Search
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
            sx={{ justifyContent: 'flex-end' }}
          />
          <ExportButton loading={downloading} onClick={handleDownload} />
        </Box>
        <Grid
          sx={{
            '& .MuiDataGrid-cell': {
              pt: 4,
              py: 4, // vertical padding (theme spacing, equivalent to padding-top and padding-bottom)
              px: 4 // horizontal padding
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
            total={+total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{
              page: page - 1,
              pageSize: pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            handleSortModel={handleSortModelChange}
            loading={loading}
            searchValue=''
            maxHeight='60vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default Listing
