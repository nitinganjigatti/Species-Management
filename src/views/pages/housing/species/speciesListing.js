import { useTheme } from '@emotion/react'
import { Avatar, Box, debounce, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import ListingHeader from '../utils/ListingHeader'
import { fetchSpecies, setPagination } from 'src/store/slices/housing/speciesSlice'

const SpeciesListing = () => {
  const theme = useTheme()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [downloadLoading, setDownloadLoading] = useState(false)
  const { id } = router.query
  const dispatch = useDispatch()

  const { list: list, loading, total, page, pageSize, search } = useSelector(state => state.species)

  useEffect(() => {
    debugger
    dispatch(fetchSpecies({ site_id: id }))
  }, [dispatch, id, page, pageSize, search])

  const handlePaginationModelChange = model => {
    const newPage = model.page + 1
    const newPageSize = model.pageSize

    if (newPage !== page || newPageSize !== pageSize) {
      dispatch(setPagination({ page: newPage, pageSize: newPageSize }))
    }
  }

  const searchTableData = useCallback(
    debounce(async value => {
      setSearchValue(value)
      try {
        dispatch(fetchSpecies({ site_id: id, page_no: page, limit: pageSize, search: value }))
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      dispatch(setPagination({ page: 1, pageSize })) // Reset to page 1
      searchTableData(value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchValue]
  )

  const getSlNo = index => (page - 1) * pageSize + index + 1

  const indexedRows = list?.map((row, index) => ({
    ...row,
    id: row?.tsn_id,
    sl_no: getSlNo(index)
  }))

  // const handleRowClick = params => {
  //   router.push({
  //     pathname: `/housing/sites/${params.row.site_id}`
  //   })
  // }

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
      field: 'common_name',
      headerName: 'Species',
      renderCell: params => {
        const imageUrl = params.row.default_icon

        return (
          <Box display='flex' alignItems='center' width='100%' gap={2}>
            {imageUrl ? (
              <Box
                component='img'
                src={imageUrl}
                alt={params.row.default_icon}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  objectFit: 'cover',
                  mr: 1
                }}
              />
            ) : (
              <Avatar
                variant='square'
                sx={{
                  width: 40,
                  height: 40,
                  mr: 1,
                  borderRadius: '8px',
                  fontSize: '14px',
                  bgcolor: theme.palette.primary.main
                }}
              >
                {params.row.site_name?.charAt(0).toUpperCase() || '?'}
              </Avatar>
            )}
            <Typography
              noWrap
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '180px',
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {params.row.section_name}
            </Typography>
          </Box>
        )
      }
    },
    // {
    //   width: 200,
    //   field: 'species',
    //   headerName: 'Species',
    //   align: 'left',
    //   headerAlign: 'left',
    //   renderCell: params => (
    //     <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
    //       {params.row.species_count || 0}
    //     </Typography>
    //   )
    // },
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
    // {
    //   width: 150,
    //   field: 'sections',
    //   headerName: 'Sections',
    //   align: 'left',
    //   headerAlign: 'left',
    //   renderCell: params => (
    //     <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
    //       {params.row.section_count}
    //     </Typography>
    //   )
    // },
    {
      width: 180,
      field: 'incharge',
      headerName: 'In-Charge',
      align: 'center',
      headerAlign: 'left',
      renderCell: params => (
        <Box display='flex' alignItems='center' width='100%'>
          <UserInfoCard />
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {params.row.incharge_name || 'NA'}
          </Typography>
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

  const handleDownload = () => {
    // download logic here
    console.log('Downloading...')
  }

  return (
    <>
      {/* <ListingHeader title='All Species' totalCount={total} onDownload={handleDownload} loading={downloadLoading} /> */}
      <Box>
        <Search
          value={searchValue}
          onChange={e => handleSearch(e.target.value)}
          onClear={() => handleSearch('')}
          placeholder='Search…'
          sx={{ mt: 2 }}
        />
        <Grid>
          <CommonTable
            onRowClick={''}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{
              page: page - 1,
              pageSize: pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            paginationMode='server'
            loading={loading}
            searchValue={searchValue}
            maxHeight='60vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default SpeciesListing
