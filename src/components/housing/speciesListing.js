import { useTheme } from '@emotion/react'
import { Avatar, Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import { fetchSpecies, setParams } from 'src/store/slices/housing/speciesSlice'
import { ExportButton } from 'src/views/utility/render-snippets'
import { debounce } from 'lodash'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import { GenderInfoCard } from 'src/utility/render'
import SpeciesDrawer from 'src/views/pages/housing/species/SpeciesDrawer'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const SpeciesListing = () => {
  const [downloading, setDownloading] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [specieName, setSpecieName] = useState('')

  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()
  const dispatch = useDispatch()

  const {
    list: speciesList,
    loading,
    total,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search
  } = useSelector(state => state.species)

  useEffect(() => {
    console.log('speciesList', speciesList)
  }, [speciesList])

  // Debounced fetchSpecies call whenever parameters change
  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(
        fetchSpecies({
          site_id: id
        })
      )
    }, 500),
    [dispatch, page, pageSize, sortBy, sortOrder, search, id]
  )

  useEffect(() => {
    if (id) debouncedFetch()

    return () => debouncedFetch.cancel()
  }, [debouncedFetch, id])

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

  const indexedRows = speciesList?.map((row, index) => ({
    ...row,
    id: +row?.tsn_id,
    sl_no: getSlNo(index)
  }))

  const handleRowClick = params => {
    setOpenDrawer(true)
    setSpecieName(params.row.common_name)
    // router.push({
    //   pathname: `/housing/sites/${params.row.site_id}`
    // })
  }

  const handleClose = () => {
    setOpenDrawer(false)
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
      width: 280,
      field: 'common_name',
      headerAlign: 'center',
      headerName: 'Species',
      renderCell: params => (
        <SpeciesCard
          species={{
            common_name: params.row.common_name,
            scientific_name: params.row.complete_name,
            default_icon: params.row.default_icon
          }}
        />
        // <UserInfoCard
        //   avatarUrl={params.row.default_icon}
        //   textColor={theme.palette.customColors.OnSurfaceVariant}
        //   name={params.row.common_name}
        //   description={params.row.complete_name}
        //   fontWeight={500}
        //   round
        // />
      )
    },
    {
      width: 180,
      field: 'animals',
      headerName: 'Population',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.animal_count || 0}
        </Typography>
      )
    },

    {
      width: 160,
      field: 'male',
      headerName: 'MALE',
      renderCell: params => (
        <GenderInfoCard
          value={params.row.sex_data?.male || 0}
          bgcolor={`${theme.palette.customColors.SecondaryContainer}80`} // background color
          color={theme.palette.customColors.addPrimary} // text color
        />
      )
    },

    {
      width: 160,
      field: 'female',
      headerName: 'FEMALE',
      renderCell: params => (
        <GenderInfoCard
          value={params.row.sex_data?.female || 0}
          bgcolor={`${theme.palette.customColors.customDropdownColor}4D`} // background (light peach)
          color={theme.palette.customColors.customDropdownColor} // text color (darker coral)
        />
      )
    },

    {
      width: 160,
      field: 'undetermined',
      headerName: 'UNDETERMINED',
      renderCell: params => (
        <GenderInfoCard
          value={params.row.sex_data?.undetermined || 0}
          bgcolor={theme.palette.customColors.SurfaceVariant} // light gray-green
          color={theme.palette.customColors.Error} // maroonish-red
        />
      )
    },
    {
      width: 160,
      field: 'indeterminate',
      headerName: 'INDETERMINATE',
      renderCell: params => (
        <GenderInfoCard
          value={params.row.sex_data?.indeterminate || 0}
          bgcolor={theme.palette.customColors.displaybgSecondary} // bluish gray
          color={theme.palette.customColors.OnPrimaryContainer} // dark gray-blue
        />
      )
    },

    {
      width: 160,
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
      <ListingHeader title='All Species' totalCount={total} />
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
              py: 6, // vertical padding (theme spacing, equivalent to padding-top and padding-bottom)
              px: 6 // horizontal padding
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
      {openDrawer && <SpeciesDrawer open={openDrawer} onClose={handleClose} specieName={specieName} />}
    </>
  )
}

export default SpeciesListing
