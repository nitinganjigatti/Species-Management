import { useTheme } from '@emotion/react'
import { Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import SpeciesDrawer from 'src/components/housing/utils/SpeciesDrawer'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { GenderInfoCard } from 'src/utility/render'
import { getAllSpeciesList } from 'src/lib/api/housing'
import AnimalDrawer from '../utils/AnimalDrawer'

const SpeciesListing = ({ selectedTab, setSelectedTab, drawerType, setDrawerType, drawerData, setDrawerData }) => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const [inputValue, setInputValue] = useState('')
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['species', id, filters],
    queryFn: () =>
      getAllSpeciesList({
        section_id: id,
        page_no: filters.page,
        limit: filters.pageSize,
        search: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }),
    enabled: !!id,
    keepPreviousData: true
  })

  const listing = data?.data?.listing || []
  const total = data?.data?.total_scies_count || 0

  const getSlNo = index => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = useMemo(
    () =>
      listing.map((row, index) => ({
        ...row,
        id: +row?.tsn_id,
        sl_no: getSlNo(index)
      })),
    [listing, filters.page, filters.pageSize]
  )

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

  const handleSortModelChange = model => {
    if (model.length > 0) {
      const { field, sort } = model[0]
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
        sortOrder: '',
        page: 1
      }))
    }
  }

  const handlePaginationModelChange = model => {
    setFilters(prev => ({
      ...prev,
      page: model.page + 1,
      pageSize: model.pageSize
    }))
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
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      width: 350,
      field: 'common_name',
      headerAlign: 'left',
      headerName: 'Species',
      sortable: false,
      renderCell: params => (
        <SpeciesCard
          species={{
            common_name: params.row.common_name,
            scientific_name: params.row.complete_name,
            default_icon: params.row.default_icon
          }}
        />
      )
    },
    {
      width: 160,
      field: 'animals',
      headerName: 'Population',
      headerAlign: 'left',
      align: 'left',
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
            console.log('params', params.row)
            setDrawerType('animals')
            setDrawerData({
              queryKey: 'section-details-species-animals-drawer',
              id: params.row.id,
              name: params.row.common_name,
              image: params.row.images?.[0]?.file,
              params: {
                id: params.row.id,
                section_id: id
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
      width: 160,
      field: 'male',
      headerName: 'MALE',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <GenderInfoCard
          value={params.row.sex_data?.male || 0}
          bgcolor={`${theme.palette.customColors.SecondaryContainer}80`}
          color={theme.palette.customColors.addPrimary}
        />
      )
    },
    {
      width: 160,
      field: 'female',
      headerName: 'FEMALE',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <GenderInfoCard
          value={params.row.sex_data?.female || 0}
          bgcolor={`${theme.palette.customColors.customDropdownColor}4D`}
          color={theme.palette.customColors.customDropdownColor}
        />
      )
    },
    {
      width: 160,
      field: 'undetermined',
      headerName: 'UNDETERMINED',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <GenderInfoCard
          value={params.row.sex_data?.undetermined || 0}
          bgcolor={theme.palette.customColors.SurfaceVariant}
          color={theme.palette.customColors.Error}
        />
      )
    },
    {
      width: 160,
      field: 'indeterminate',
      headerAlign: 'left',
      align: 'left',
      headerName: 'INDETERMINATE',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <GenderInfoCard
          value={params.row.sex_data?.indeterminate || 0}
          bgcolor={theme.palette.customColors.displaybgSecondary}
          color={theme.palette.customColors.OnPrimaryContainer}
        />
      )
    }

    // {
    //   width: 160,
    //   field: 'actions',
    //   headerName: 'Actions',
    //   align: 'center',
    //   headerAlign: 'center',
    //   sortable: false,
    //   renderCell: () => (
    //     <Box display='flex' justifyContent='center' alignItems='center' gap={3}>
    //       <Box component='img' src='/images/call.png' alt='Phone' sx={{ width: 20, height: 20, cursor: 'pointer' }} />
    //       <Box
    //         component='img'
    //         src='/images/message.png'
    //         alt='Message'
    //         sx={{ width: 20, height: 20, cursor: 'pointer' }}
    //       />
    //     </Box>
    //   )
    // }
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
              py: 6,
              px: 6
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '12px',
              fontWeight: 600,
              mr:2
            }
          }}
        >
          <CommonTable
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
            loading={isLoading}
            searchValue={filters.search}
            maxHeight='80vh'
          />
        </Grid>
      </Box>
      {drawerType === 'animals' && <AnimalDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
    </>
  )
}

export default React.memo(SpeciesListing)
