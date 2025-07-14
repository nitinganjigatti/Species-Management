import { useTheme } from '@emotion/react'
import { Avatar, Box, debounce, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import { fetchNotes, setPagination } from 'src/store/slices/housing/notesSlice'

const NotesListng = () => {
  const theme = useTheme()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [downloadLoading, setDownloadLoading] = useState(false)
  const { id } = router.query
  const dispatch = useDispatch()

  const { list: noteList, loading, total, page, pageSize } = useSelector(state => state.notes)

  useEffect(() => {
    dispatch(fetchNotes({ id: id, type: 'site', page_no: page, limit: pageSize, q: searchValue }))
  }, [dispatch, page, pageSize])

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
        dispatch(fetchNotes({ id: id, type: 'site', page_no: page, limit: pageSize, q: value }))
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

  const indexedRows = noteList?.map((row, index) => ({
    ...row,
    id: row?.observation_id,
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
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'observation_name',
      align: 'center',
      headerAlign: 'left',
      headerName: 'Observation Name',
      renderCell: params => {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: 2
            }}
          >
            <Typography
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
              {params.row.observation_name ? params.row.observation_name : 'NA'}
            </Typography>
          </Box>
        )
      }
    },
    {
      width: 200,
      field: 'priority',
      headerName: 'Priority',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '14px', fontWeight: 600 }}>
          {params.row.priority ? params.row.priority : '-'}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'created_by_phone',
      headerName: 'Phone No',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '14px', fontWeight: 600 }}>
          {params.row.created_by_phone || 0}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'created_by',
      headerName: 'Created By',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.created_by}
        </Typography>
      )
    },

    {
      width: 200,
      field: 'actions',
      headerName: 'Actions',
      align: 'center',
      headerAlign: 'center',
      renderCell: () => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3
          }}
        >
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
      <ListingHeader title='Notes' totalCount={total} onDownload={handleDownload} loading={downloadLoading} />
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
            maxHeight='80vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default NotesListng
