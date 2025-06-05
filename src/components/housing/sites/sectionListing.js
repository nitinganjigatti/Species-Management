import { useTheme } from '@emotion/react'
import { Box, Grid, Typography, useMediaQuery } from '@mui/material'
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
import EnclosureDrawer from '../utils/EnclosureDrawer'
import SpeciesDrawer from '../utils/SpeciesDrawer'
import AnimalDrawer from '../utils/AnimalDrawer'

const SectionListing = ({ selectedTab, setSelectedTab, drawerType, setDrawerType, drawerData, setDrawerData }) => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

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
        search: filters.search,
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
    if (
      params.field !== 'actions' &&
      params.field !== 'id' &&
      params.field !== 'species' &&
      params.field !== 'animals' &&
      params.field !== 'sections' &&
      params.field !== 'enclosures'
    ) {
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
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 300,
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
      width: 180,
      field: 'species',
      headerName: 'Species',
      align: 'left',
      headerAlign: 'left',
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
            setDrawerType('species')
            setDrawerData({
              queryKey: 'section-species-drawer',
              id: params.row.section_id,
              name: params.row.section_name,
              image: params.row.images?.[0]?.file,
              params: {
                section_id: params.row.section_id
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
            {params.row.species_count || 0}
          </Typography>
        </Box>
      )
    },
    {
      width: 150,
      field: 'animals',
      headerName: 'Animals',
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
            setDrawerType('animals')
            setDrawerData({
              queryKey: 'section-animals-drawer',
              id: params.row.section_id,
              name: params.row.section_name,
              image: params.row.images?.[0]?.file,
              params: {
                section_id: params.row.section_id
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
      width: 150,
      field: 'enclosures',
      headerName: 'Enclosures',
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

            // setDrawerType('enclosures')
            // setDrawerData({
            //   queryKey: 'section-enclosures-drawer',
            //   id: params.row.section_id,
            //   name: params.row.section_name,
            //   image: params.row.images?.[0]?.file,
            //   params: {
            //     section_id: params.row.section_id
            //   }
            // })
          }}
        >
          <Typography
            sx={{
              color: theme.palette.primary.OnSurface,
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {params.row.enclosure_count || 0}
          </Typography>
        </Box>
      )
    },
    {
      width: 180,
      field: 'incharge',
      headerName: 'In-Charge',
      align: 'left',
      headerAlign: 'left',
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
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      renderCell: params => {
        const phoneNumber = params.row.incharge_mobile_no
        let pressTimer

        const handleLongPress = () => {
          if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            alert('Number copied to clipboard')
          }
        }

        const handleMouseDown = () => {
          pressTimer = setTimeout(handleLongPress, 700)
        }

        const handleMouseUp = () => {
          clearTimeout(pressTimer)
        }

        return isSmallScreen ? (
          phoneNumber ? (
            <Box display='flex' gap={4}>
              {/* Call Icon */}
              <Box
                component='img'
                src='/images/call.png'
                alt='Call'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
                onClick={() => window.open(`tel:${phoneNumber}`)}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              />
              {/* Message Icon */}
              <Box
                component='img'
                src='/images/message.png' // <-- Replace with your message icon path
                alt='Message'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
                onClick={() => window.open(`sms:${phoneNumber}`)}
              />
            </Box>
          ) : (
            '-'
          )
        ) : (
          <Typography sx={{ fontSize: '14px', fontWeight: 500, cursor: 'default' }}>{phoneNumber || '-'}</Typography>
        )
      }
    }
  ]

  return (
    <>
      <ListingHeader title='All Sections' totalCount={total} />
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
              mr: 1
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
      {drawerType === 'species' && <SpeciesDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
      {drawerType === 'animals' && <AnimalDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
      {drawerType === 'enclosures' && (
        <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
      )}
    </>
  )
}

export default React.memo(SectionListing)
