import { useTheme } from '@emotion/react'
import { Avatar, Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import { format, formatDistanceToNow } from 'date-fns'
import { ExportButton } from 'src/views/utility/render-snippets'
import { debounce } from 'lodash'
import ListingHeader from '../../views/pages/housing/utils/ListingHeader'
import { fetchMortality, setParams } from 'src/store/slices/housing/mortalitySlice'
import { DateInfoDisplay, IdentifierInfoCard } from 'src/utility/render'

const MortalityListing = () => {
  const [downloading, setDownloading] = useState(false)

  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()
  const dispatch = useDispatch()

  const {
    list: MortalityList,
    loading,
    total,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search
  } = useSelector(state => state.mortality)

  useEffect(() => {
    console.log('MortalityList', MortalityList)
  }, [MortalityList])

  // Debounced fetchSpecies call whenever parameters change
  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(
        fetchMortality({
          site_id: id,
          type: 'animals'
        })
      )
    }, 500),
    [dispatch, page, pageSize, sortBy, sortOrder, search, id]
  )

  useEffect(() => {
    if (id) debouncedFetch()

    return () => debouncedFetch.cancel()
  }, [debouncedFetch, id, page])

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

  const indexedRows = MortalityList?.map((row, index) => ({
    ...row,
    id: +row?.animal_id,
    sl_no: getSlNo(index)
  }))

  const handleRowClick = params => {
    // router.push({
    //   pathname: `/housing/sites/${params.row.site_id}`
    // })
  }

  const columns = [
    {
      width: 100,
      field: 'sl_no',
      headerName: 'NO',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 300,
      field: 'common_name',
      headerName: 'SPECIES',
      renderCell: params => (
        <UserInfoCard
          avatarUrl={params.row.default_icon}
          textColor={theme.palette.customColors.OnSurfaceVariant}
          name={params.row.scientific_name}
          description={params.row.common_name}
          fontWeight={500}
          round
        />
      )
    },
    {
      width: 250,
      field: 'identifier',
      headerName: 'IDENTIFIER',
      renderCell: params => (
        <IdentifierInfoCard
          animalId={params.row.animal_id}
          total={total}
          localIdentifierName={params.row.local_identifier_name}
          localIdentifierValue={params.row.local_identifier_value}
        />
      )
    },
    {
      width: 250,
      field: 'animal_name',
      headerName: 'ANIMAL NAME',
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.common_name}
        </Typography>
      )
    },

    {
      field: 'died_on',
      headerName: 'DIED ON',
      width: 250,
      renderCell: params => <DateInfoDisplay date={params.row.discovered_date} showRelativeTime />
    },
    {
      field: 'reported_on',
      headerName: 'REPORTED ON',
      width: 250,
      renderCell: params => <DateInfoDisplay title={params.row.user_enclosure_name} date={params.row.discovered_date} />
    },

    {
      width: 300,
      field: 'reason',
      headerName: 'REASON',
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            color: theme.palette.customColors.OnSurfaceVariant,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}
        >
          {params.row.reason_name}
        </Typography>
      )
    }
  ]

  return (
    <>
      <ListingHeader title='Mortality' totalCount={total} />
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
            total={total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{
              page: page - 1,
              pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            handleSortModel={handleSortModelChange}
            loading={loading}
            searchValue={search}
            maxHeight='80vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default MortalityListing
