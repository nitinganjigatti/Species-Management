import { useTheme } from '@emotion/react'
import { Avatar, Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import { format, formatDistanceToNow } from 'date-fns'

// import { fetchMortality, setParams } from 'src/store/slices/housing/speciesSlice'
import { ExportButton } from 'src/views/utility/render-snippets'
import { debounce } from 'lodash'
import ListingHeader from '../../views/pages/housing/utils/ListingHeader'
import { fetchAnimals, setParams } from 'src/store/slices/housing/animalTreatmentSlice'
import { GenderInfoCard, IdentifierInfoCard } from 'src/utility/render'

const AnimalTreatmentListing = () => {
  const [downloading, setDownloading] = useState(false)

  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()
  const dispatch = useDispatch()

  const {
    list: animalTreatmentList,
    loading,
    total,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search
  } = useSelector(state => state.animalTreatment)

  useEffect(() => {
    console.log('animalTreatmentList', animalTreatmentList)
  }, [animalTreatmentList])

  // Debounced fetchSpecies call whenever parameters change
  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(
        fetchAnimals({
          site_id: id
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

  const indexedRows = animalTreatmentList?.map((row, index) => ({
    ...row,
    id: row?.animal_id,
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
      width: 160,
      field: 'sex',
      headerName: 'Gender',
      renderCell: params => {
        const gender = params.row.sex?.toLowerCase()

        // Define style mapping
        const genderStyles = {
          male: {
            bgcolor: `${theme.palette.customColors.SecondaryContainer}80`,
            color: theme.palette.customColors.addPrimary
          },
          female: {
            bgcolor: `${theme.palette.customColors.customDropdownColor}4D`,
            color: theme.palette.customColors.customDropdownColor
          },
          undetermined: {
            bgcolor: theme.palette.customColors.SurfaceVariant,
            color: theme.palette.customColors.Error
          },
          indeterminate: {
            bgcolor: theme.palette.customColors.displaybgSecondary,
            color: theme.palette.customColors.OnPrimaryContainer
          }
        }

        // Short display labels
        const genderLabels = {
          male: 'M',
          female: 'F',
          undetermined: 'UD',
          indeterminate: 'ID'
        }

        const { bgcolor, color } = genderStyles[gender] || genderStyles.indeterminate
        const label = genderLabels[gender] || 'ID'

        return <GenderInfoCard value={label} bgcolor={bgcolor} color={color} />
      }
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
      width: 250,
      field: 'section_name',
      headerName: 'Section Name',
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.section_name}
        </Typography>
      )
    },
    {
      width: 250,
      field: 'site_name',
      headerName: 'Site Name',
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.site_name}
        </Typography>
      )
    },

    {
      width: 250,
      field: 'user_enclosure_name',
      headerName: 'Enclosure Name',
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.user_enclosure_name}
        </Typography>
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
            maxHeight='60vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default AnimalTreatmentListing
