import { useTheme } from '@emotion/react'
import { Avatar, Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'
import { fetchSections, setPagination } from 'src/store/slices/housing/sectionSlice'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import ListingHeader from '../utils/ListingHeader'
import { ExportButton } from 'src/views/utility/render-snippets'

const SectionListing = () => {
  const theme = useTheme()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [downloading, setDownloading] = useState(false)
  const { id } = router.query
  const dispatch = useDispatch()
  const { id } = router.query

  const { list: sectionList, loading, total, page, pageSize, search } = useSelector(state => state.section)

  const getSlNo = index => (page - 1) * pageSize + index + 1

  const indexedRows = sectionList?.map((row, index) => ({
    ...row,
    id: row.section_id,
    sl_no: getSlNo(index)
  }))

  // Debounced fetch
  const debouncedFetch = useCallback(
    debounce(() => {
      if (id) {
        dispatch(fetchSections({ site_id: id }))
      }
    }, 500),
    [dispatch, id, page, pageSize, search]
  )

  useEffect(() => {
    debouncedFetch()
    debugger
    return () => debouncedFetch.cancel()
  }, [debouncedFetch])

  const handlePaginationModelChange = model => {
    const newPage = model.page + 1
    const newPageSize = model.pageSize
    if (newPage !== page || newPageSize !== pageSize) {
      dispatch(setPagination({ page: newPage, pageSize: newPageSize }))
    }
  }

  const handleSearch = useCallback(
    value => {
      dispatch(setPagination({ page: 1, search: value }))
    },
    [dispatch]
  )

  const handleDownload = () => {
    console.log('Downloading sections...')
  }

  const handleRowClick = params => {
    router.push({
      pathname: `/housing/sections/${params.row.section_id}`
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
      field: 'section_name',
      headerName: 'Section Name',
      renderCell: params => {
        const imageUrl = params.row.images?.[0]?.file
        return (
          <Box display='flex' alignItems='center' width='100%' gap={2}>
            {imageUrl ? (
              <Box
                component='img'
                src={imageUrl}
                alt={params.row.section_name}
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
                {params.row.section_name?.charAt(0).toUpperCase() || '?'}
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

  return (
    <>
      <ListingHeader title='All Sections' totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <Search
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
            sx={{ justifyContent: 'flex-end' }}
          />
          <ExportButton loading={downloading} onClick={handleDownload} />
        </Box>
        <Grid>
          <CommonTable
            onRowClick={handleRowClick}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{
              page: page - 1,
              pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            loading={loading}
            searchValue=''
            maxHeight='60vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default SectionListing
