import { useTheme } from '@emotion/react'
import { Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'

// import { fetchMortality, setParams } from 'src/store/slices/housing/speciesSlice'
import { ExportButton } from 'src/views/utility/render-snippets'
import { debounce } from 'lodash'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { GenderInfoCard, IdentifierInfoCard } from 'src/utility/render'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { getAnimalTreatmentList } from 'src/lib/api/housing'
import { useQuery } from '@tanstack/react-query'

const AnimalTreatmentListing = () => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()

  const [downloading, setDownloading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const { data, isFetching } = useQuery({
    queryKey: ['aminal-treatment-listing', id, filters],
    queryFn: () =>
      getAnimalTreatmentList({
        site_id: id,
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }),
    enabled: !!id
  })

  const animalTreatmentList = data?.data?.result || []
  const total = data?.data?.total_count || 0

  const getSlNo = index => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = animalTreatmentList.map((row, index) => ({
    ...row,
    id: +row?.animal_id,
    sl_no: getSlNo(index)
  }))

  const handlePaginationModelChange = model => {
    const newPage = model.page + 1
    const newPageSize = model.pageSize

    if (newPage !== filters.page || newPageSize !== filters.pageSize) {
      setFilters(prev => ({
        ...prev,
        page: newPage,
        pageSize: newPageSize
      }))
    }
  }

  const handleSortModelChange = sortModel => {
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: sort,
        page: 1
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: '',
        sortOrder: 'asc'
      }))
    }
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        setFilters(prev => ({
          ...prev,
          search: value,
          page: 1
        }))
      }, 500),
    []
  )

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  const handleSearch = value => {
    setInputValue(value)
    debouncedSearch(value)
  }

  const handleDownload = () => {
    console.log('Downloading...')
  }

  const handleRowClick = params => {
    // router.push({
    //   pathname: `/housing/sites/${params.row.site_id}`
    // })
  }

  const columns = [
    {
      width: 80,
      field: 'sl_no',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },

    {
      width: 350,
      field: 'common_name',
      headerName: 'SPECIES',
      sortable: false,
      renderCell: params => (
        <SpeciesCard
          species={{
            common_name: params.row.common_name,
            scientific_name: params.row.scientific_name,
            default_icon: params.row.default_icon
          }}
        />
      )
    },

    {
      width: 250,
      field: 'identifier',
      headerName: 'ANTZ ANIMAL ID',
      sortable: false,
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
      headerName: 'PRIMARY IDENTIDIER',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.common_name}
        </Typography>
      )
    },

    {
      width: 160,
      field: 'sex',
      headerName: 'Gender',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
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
      field: 'section_name',
      headerName: 'Section Name',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
          {params.row.section_name}
        </Typography>
      )
    },

    // {
    //   width: 250,
    //   field: 'site_name',
    //   headerName: 'Site Name',
    //   sortable: false,
    //   renderCell: params => (
    //     <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
    //       {params.row.site_name}
    //     </Typography>
    //   )
    // },

    {
      width: 250,
      field: 'user_enclosure_name',
      align: 'left',
      headerAlign: 'left',
      headerName: 'Enclosure Name',
      sortable: false,
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
              page: filters.page - 1,
              pageSize: filters.pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            handleSortModel={handleSortModelChange}
            loading={isFetching}
            searchValue={filters.inputValue}
            maxHeight='80vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default AnimalTreatmentListing
