import { useTheme } from '@emotion/react'
import { Box, debounce, Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import { getAllAnimalList, getAllSites, getAllSpeciesList } from 'src/lib/api/housing'
import RenderUtility, { CellInfo, GenderInfoCard } from 'src/utility/render'
import AnimalCard from 'src/views/pages/housing/animals/AnimalCard'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import AnimalDrawer from '../utils/AnimalDrawer'

const ClusterSpecies = () => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()

  const [downloading, setDownloading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [drawerData, setDrawerData] = useState(null)

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const { data, isFetching } = useQuery({
    queryKey: ['clusterspecies', id, filters],
    queryFn: () =>
      getAllSpeciesList({
        cluster_id: id,
        page_no: filters.page,
        limit: filters.pageSize,
        search: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }),
    enabled: !!id
  })

  const speciesListing = data?.data?.listing || []
  console.log('Species >>', speciesListing)
  const total = data?.data?.total_scies_count || 0

  const getSlNo = index => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = speciesListing.map((row, index) => ({
    ...row,
    id: +row?.tsn_id,
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

  // useEffect(() => {
  //   return () => debouncedSearch.cancel()
  // }, [debouncedSearch])

  const handleSearch = value => {
    setInputValue(value)
    debouncedSearch(value)
  }

  const handleDownload = () => {
    if (!indexedRows || indexedRows.length === 0) return

    setDownloading(true)

    const csvHeader = ['SL.NO', 'Section Name', 'Species Count', 'Animal Count', 'Enclosure Count', 'In-Charge']

    const csvRows = indexedRows.map(row => [
      row.sl_no,
      `"${row.section_name}"`,
      row.species_count || 0,
      row.animal_count || 0,
      row.enclosure_count || 0,
      `"${row.incharge_name || '-'}"`
    ])

    const csvContent = [csvHeader.join(','), ...csvRows.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `sections_export_${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setDownloading(false)
  }

  const handleRowClick = params => {
    setOpenDrawer(true)
    setDrawerData({
      queryKey: 'cluster-animals-drawer',
      id: id,
      complete_name: params.row.complete_name,
      common_name: params.row.common_name,
      animal_count: params.row.animal_count,
      default_icon: params.row.default_icon,
      sex_data: params.row.sex_data,
      params: {
        id: id,
        taxonomy_id: params.row.tsn_id
      }
    })
  }

  const handleClose = () => {
    setOpenDrawer(false)
    setDrawerData(null)
  }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.neutralSecondary,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'default'
          }}
        >
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      width: 280,
      field: 'common_name',
      headerAlign: 'left',
      sortable: false,
      headerName: 'Species',
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
        <Typography
          sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
        >
          {params.row.animal_count || 0}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'male',
      headerName: 'MALE',
      headerAlign: 'left',
      align: 'left',
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
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      headerAlign: 'left',
      align: 'left',
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
      headerAlign: 'left',
      align: 'left',
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
      align: 'left',
      headerAlign: 'left',
      headerName: 'INDETERMINATE',

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
    //   sortable: false,
    //   headerAlign: 'center',
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
              py: 4,
              px: 4
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '12px',
              fontWeight: 600,
              mr: 2
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
            searchValue=''
            maxHeight='80vh'
          />
        </Grid>
      </Box>
      {openDrawer && <AnimalDrawer open={!!drawerData} onClose={handleClose} data={drawerData} />}
    </>
  )
}

export default ClusterSpecies
