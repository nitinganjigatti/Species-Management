import { useTheme } from '@emotion/react'
import { Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import { getAllSections } from 'src/lib/api/housing'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { ExportButton } from 'src/views/utility/render-snippets'
import RenderUtility, { CellInfo, SectionCellRenderer } from 'src/utility/render'

const SectionListing = () => {
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
    queryKey: ['sections', id, filters],
    queryFn: () =>
      getAllSections({
        site_id: id,
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }),
    enabled: !!id
  })

  const sectionList = data?.data?.result || []
  const total = data?.data?.total_count || 0

  const updateUrlParams = updatedFilters => {
    const currentQuery = { ...router.query }

    // Update only the section-related filter keys
    const updatedQuery = {
      ...currentQuery,
      sectionPage: updatedFilters.page,
      sectionPageSize: updatedFilters.pageSize,
      sectionSearch: updatedFilters.search,
      sectionSortBy: updatedFilters.sortBy,
      sectionSortOrder: updatedFilters.sortOrder
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

  const indexedRows = sectionList.map((row, index) => ({
    ...row,
    id: +row?.section_id,
    sl_no: getSlNo(index)
  }))

  const handlePaginationModelChange = model => {
    const updated = {
      ...filters,
      page: model.page + 1,
      pageSize: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleSortModelChange = sortModel => {
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
    if (params.field !== 'actions' && params.field !== 'id') {
      router.push({
        pathname: `/housing/sections/${params.row.section_id}`,
        query: {
          ...router.query,
          sectionPage: filters.page,
          sectionPageSize: filters.pageSize,
          sectionSearch: filters.search,
          sectionSortBy: filters.sortBy,
          sectionSortOrder: filters.sortOrder
        }
      })
    }
  }

  useEffect(() => {
    setFilters(prev => ({
      page: Number(router.query.sectionPage) || 1,
      pageSize: Number(router.query.sectionPageSize) || 10,
      search: router.query.sectionSearch || '',
      sortBy: router.query.sectionSortBy || '',
      sortOrder: router.query.sectionSortOrder || 'asc'
    }))
    setInputValue(router.query.sectionSearch || '')
  }, [
    router.query.sectionPage,
    router.query.sectionPageSize,
    router.query.sectionSearch,
    router.query.sectionSortBy,
    router.query.sectionSortOrder
  ])

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
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
      sortable: false,
      renderCell: params => (
        <CellInfo
          value={params.row.section_name}
          subtitle={''}
          imgUrl={params.row.images?.[0]?.file}
          avatarUrl={''}
          inchagename={''}
        />
      )
    },
    {
      width: 200,
      field: 'species',
      headerName: 'Species',
      sortable: false,
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
      sortable: false,
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
      sortable: false,
      renderCell: params => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {params.row.enclosure_count}
        </Typography>
      )
    },
    {
      width: 180,
      field: 'incharge',
      headerName: 'In-Charge',
      sortable: false,
      renderCell: params =>
        RenderUtility.renderUserAvatarDetails(
          params.row.incharge_image,
          params.row.incharge_name,
          '',
          theme.palette.customColors.OnSurfaceVariant,
          '14px'

          //  theme.palette.customColors.OnSurfaceVariant,
        )
    },
    {
      width: 150,
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      align: 'center',
      renderCell: params => (
        <>
          {params.row.incharge_name ? (
            <Box display='flex' justifyContent='center' alignItems='center' gap={3}>
              <Box
                component='img'
                src='/images/call.png'
                alt='Phone'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
              />
              <Box
                component='img'
                src='/images/message.png'
                alt='Message'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
              />
            </Box>
          ) : (
            '-'
          )}
        </>
      )
    }
  ]

  return (
    <>
      <ListingHeader title='All Sections' totalCount={total} />
      <Box>
        {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
          <Search
            value={inputValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
            sx={{ justifyContent: 'flex-end' }}
          />
          <ExportButton loading={downloading} onClick={handleDownload} />
        </Box> */}

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
              fontWeight: 600
            }
          }}
        >
          <CommonTable
            onCellClick={handleRowClick}
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
    </>
  )
}

export default React.memo(SectionListing)
