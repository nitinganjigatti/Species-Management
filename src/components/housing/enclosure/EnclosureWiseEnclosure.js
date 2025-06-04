import { useTheme } from '@emotion/react'
import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import { getEnclosureListSectionWise } from 'src/lib/api/housing'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'

const EnclosureWiseEnclosure = () => {
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

  const { data, isLoading } = useQuery({
    queryKey: ['enclosure-wise-enclosure', id, filters],
    queryFn: () =>
      getEnclosureListSectionWise({
        enclosure_id: id,
        include_sub_enclosure: 1,
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }),
    enabled: !!id,
    keepPreviousData: true
  })

  const listing = data?.data?.list_items || []
  const total = data?.data?.total_count || 0

  const updateUrlParams = updatedFilters => {
    const currentQuery = { ...router.query }

    // Update only the section-related filter keys
    const updatedQuery = {
      ...currentQuery,
      enclosurePage: updatedFilters.page,
      enclosurePageSize: updatedFilters.pageSize,
      enclosureSearch: updatedFilters.search,
      enclosureSortBy: updatedFilters.sortBy,
      enclosureSortOrder: updatedFilters.sortOrder
    }

    router.replace(
      {
        pathname: router.pathname,
        query: updatedQuery
      },
      undefined,
      { shallow: true }
    )
  }

  const getSlNo = index => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = useMemo(
    () =>
      listing.map((row, index) => ({
        ...row,
        id: +row?.enclosure_id,
        sl_no: getSlNo(index)
      })),
    [listing, filters.page, filters.pageSize]
  )

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        const updated = {
          ...filters,
          search: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
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
    let updated
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      updated = {
        ...filters,
        sortBy: field,
        sortOrder: sort,
        page: 1
      }
    } else {
      updated = {
        ...filters,
        sortBy: '',
        sortOrder: 'asc'
      }
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const handlePaginationModelChange = model => {
    const updated = {
      ...filters,
      page: model.page + 1,
      pageSize: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  useEffect(() => {
    setFilters(prev => ({
      page: Number(router.query.enclosurePage) || 1,
      pageSize: Number(router.query.enclosurePageSize) || 10,
      search: router.query.enclosureSearch || '',
      sortBy: router.query.enclosureSortBy || '',
      sortOrder: router.query.enclosureSortOrder || 'asc'
    }))
    setInputValue(router.query.enclosureSearch || '')
  }, [
    router.query.enclosurePage,
    router.query.enclosurePageSize,
    router.query.enclosureSearch,
    router.query.enclosureSortBy,
    router.query.enclosureSortOrder
  ])

  const columns = [
    {
      width: 80,
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
      width: 330,
      field: 'user_enclosure_name',
      headerAlign: 'left',
      headerName: 'Enclosures',
      sortable: false,
      renderCell: params => (
        <SpeciesCard
          species={{
            common_name: params.row.user_enclosure_name,
            scientific_name: params.row.parent_enclosure_name ? `P. Encl: ${params.row.parent_enclosure_name}` : '',
            default_icon: params.row.image
          }}
        />
      )
    },
    {
      width: 160,
      field: 'species_count',
      headerName: 'SPECIES',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.species_count || '-'}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'enclosure_wise_animal_count',
      headerName: 'ANIMALS',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.enclosure_wise_animal_count || 0}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'sub_enclosure_count',
      headerName: 'SUB ENCLOSURES',
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.sub_enclosure_count || 0}
        </Typography>
      )
    },
    {
      width: 250,
      field: 'site_name',
      headerName: 'SITE',
      sortable: false,
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.site_name || ''}
        </Typography>
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

  const onRowClick = params => {
    router.push({
      pathname: `/housing/enclosure/${params.row.enclosure_id}`,
      query: {
        ...router.query,
        enclosureTab: 'enclosures'
      }
    })
  }

  return (
    <>
      <ListingHeader title='All Enclosures' totalCount={total} />
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
              ml: 2
            }
          }}
        >
          <CommonTable
            onRowClick={onRowClick}
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
    </>
  )
}

export default EnclosureWiseEnclosure
