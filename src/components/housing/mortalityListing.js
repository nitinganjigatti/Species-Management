import { useTheme } from '@emotion/react'
import { Box, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import { ExportButton } from 'src/views/utility/render-snippets'
import ListingHeader from '../../views/pages/housing/utils/ListingHeader'
import { DateInfoDisplay, IdentifierInfoCard } from 'src/utility/render'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { getMortalityList } from 'src/lib/api/housing'
import { debounce } from 'lodash'

const MortalityListing = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

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
    queryKey: ['mortality-list', id, filters],
    queryFn: () =>
      getMortalityList({
        page_no: filters.page,
        limit: filters.pageSize,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder,
        q: filters.search,
        site_id: id,
        type: 'animals'
      }),
    enabled: !!id
  })

  const sectionList = data?.data?.result || []
  const total = data?.data?.total_count || 0

  const getSlNo = index => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = sectionList.map((row, index) => ({
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
    // router.push({ pathname: `/housing/sites/${params.row.site_id}` })
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
      headerName: 'IDENTIFIER',
      renderCell: params => (
        <IdentifierInfoCard
          animalId={params.row.animal_id}
          total={data?.data?.total_count || 0}
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
            value={inputValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
            sx={{ justifyContent: 'flex-end' }}
          />
          <ExportButton loading={downloading} onClick={handleDownload} /> 
        </Box>

        <Grid
          sx={{
           
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
            total={data?.data?.total_count || 0}
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

export default MortalityListing
