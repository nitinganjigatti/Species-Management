import { useTheme } from '@emotion/react'
import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import { getEnclosureWiseSpecies } from 'src/lib/api/housing'
import { GenderInfoCard } from 'src/utility/render'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import AnimalDrawer from '../utils/AnimalDrawer'
import { useAuth } from 'src/hooks/useAuth'

const EnclosureWiseSpecies = ({
  selectedTab,
  setSelectedTab,
  drawerType,
  setDrawerType,
  drawerData,
  setDrawerData
}) => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [inputValue, setInputValue] = useState('')
  const [downloading, setDownloading] = useState(false)

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const [totalCount, setTotalCount] = useState(0)

  const auth = useAuth()
  const insightsViewAccess = auth?.userData?.roles?.settings?.housing_view_insights

  const { data, isLoading, error } = useQuery({
    queryKey: ['enclosure-wise-species', id, filters],
    queryFn: () =>
      getEnclosureWiseSpecies(
        {
          include_sub_enclosure: 1,
          page_no: filters.page,
          limit: filters.pageSize,
          q: filters.search,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder
        },
        id
      ),
    enabled: !!id,
    keepPreviousData: true
  })

  const listing = data?.data?.listing || []
  const total = data?.data?.listing?.length || 0

  const getSlNo = index => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = useMemo(
    () =>
      listing.map((row, index) => ({
        ...row,
        id: +row?.taxonomy_id,
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

  const handleDrawerClose = () => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const columns = [
    {
      width: 90,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            pl: 2
          }}
        >
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
        </Box>
      )
    },
    {
      width: 350,
      field: 'common_name',
      headerAlign: 'left',
      headerName: 'Species',
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left'
          }}
        >
          <SpeciesCard
            species={{
              common_name: params.row.common_name,
              scientific_name: params.row.complete_name,
              default_icon: params.row.default_icon
            }}
          />
        </Box>
      )
    },
    ...(insightsViewAccess
      ? [
          {
            width: 180,
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
                  cursor: 'pointer',
                  justifyContent: 'left',
                  pl: 2
                }}
                onClick={e => {
                  e.stopPropagation()
                  setDrawerType('animals')
                  setDrawerData({
                    queryKey: 'enclosure-wise-species-drawer',
                    id: id,
                    complete_name: params.row.complete_name,
                    common_name: params.row.common_name,
                    animal_count: params.row.animal_count,
                    default_icon: params.row.default_icon,
                    sex_data: params.row.sex_data,
                    params: {
                      enclosure_id: id,
                      taxonomy_id: params.row.tsn_id
                    }
                  })
                  setTotalCount(params.row.animal_count || 0)
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
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={params.row.sex_data?.male || 0}
                  bgcolor={`${theme.palette.customColors.SecondaryContainer}80`}
                  color={theme.palette.customColors.addPrimary}
                />
              </Box>
            )
          },
          {
            width: 160,
            field: 'female',
            headerName: 'FEMALE',
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
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={params.row.sex_data?.female || 0}
                  bgcolor={`${theme.palette.customColors.customDropdownColor}4D`}
                  color={theme.palette.customColors.customDropdownColor}
                />
              </Box>
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
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={params.row.sex_data?.undetermined || 0}
                  bgcolor={theme.palette.customColors.SurfaceVariant}
                  color={theme.palette.customColors.Error}
                />
              </Box>
            )
          },
          {
            width: 160,
            field: 'indeterminate',
            headerName: 'INDETERMINATE',
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
                  justifyContent: 'left'
                }}
              >
                <GenderInfoCard
                  value={params.row.sex_data?.indeterminate || 0}
                  bgcolor={theme.palette.customColors.displaybgSecondary}
                  color={theme.palette.customColors.OnPrimaryContainer}
                />
              </Box>
            )
          }
        ]
      : [])
  ]

  const handleDownload = () => {
    console.log('Download button clicked')
  }

  // const handleRowClick = params => {
  //   setOpenDrawer(true)
  //   setDrawerData({
  //     queryKey: 'enclosure-wise-species-drawer',
  //     id: id,
  //     complete_name: params.row.complete_name,
  //     common_name: params.row.common_name,
  //     animal_count: params.row.animal_count,
  //     default_icon: params.row.default_icon,
  //     sex_data: params.row.sex_data,
  //     params: {
  //       enclosure_id: id,
  //       taxonomy_id: params.row.tsn_id
  //     }
  //   })
  // }

  console.log(drawerData)

  // const handleClose = () => {
  //   setOpenDrawer(false)
  //   setDrawerData(null)
  // }

  return (
    <>
      <ListingHeader title='All Species' totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
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
              mr: 2
            }
          }}
        >
          <CommonTable

            // onRowClick={handleRowClick}
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
      {drawerType === 'animals' && (
        <AnimalDrawer totalCount={totalCount} open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
      )}
    </>
  )
}

export default React.memo(EnclosureWiseSpecies)
