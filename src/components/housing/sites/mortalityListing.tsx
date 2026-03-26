import { useTheme } from '@emotion/react'
import { Box, Grid, Typography, Theme } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'
import { ExportButton } from 'src/views/utility/render-snippets'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { DateInfoDisplay, IdentifierInfoCard } from 'src/utility/render'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { getMortalityList } from 'src/lib/api/housing'
import { debounce } from 'lodash'
import { IndexedMortalityRow } from 'src/types/housing'
import { GridCellParams, GridSortModel, GridRowParams } from '@mui/x-data-grid'

interface MortalityFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface MortalityRow {
  animal_id?: number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  local_identifier_name?: string
  local_identifier_value?: string
  discovered_date?: string
  user_enclosure_name?: string
  reason_name?: string
}

interface PaginationModel {
  page: number
  pageSize: number
}

const MortalityListing: React.FC = () => {
  const theme = useTheme() as Theme
  const router = useRouter()
  const { id } = router.query

  const [downloading, setDownloading] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')

  const [filters, setFilters] = useState<MortalityFilters>({
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
        sort_order: filters.sortOrder as 'asc' | 'desc' | undefined,
        q: filters.search,
        site_id: Number(id),
        type: 'animals'
      }),
    enabled: !!id
  })

  const sectionList: MortalityRow[] = data?.data?.result || []
  const total: number = data?.data?.total_count || 0

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = sectionList.map((row, index) => ({
    ...row,
    id: +(row?.animal_id || 0),
    sl_no: getSlNo(index)
  }))

  const handlePaginationModelChange = (model: PaginationModel): void => {
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

  const handleSortModelChange = (sortModel: GridSortModel): void => {
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: sort as 'asc' | 'desc',
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
      debounce((value: string) => {
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

  const handleSearch = (value: string): void => {
    setInputValue(value)
    debouncedSearch(value)
  }

  const handleDownload = (): void => {
    console.log('Downloading...')
  }

  const handleRowClick = (params: GridRowParams): void => {
    if (params.row.animal_id) {
      router.push(`/housing/animals/${params.row.animal_id}`)
    }
  }

  const columns = [
    {
      width: 90,
      field: 'id',
      headerName: 'SL.NO',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
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
              fontWeight: 500
            }}
          >
            {parseInt((params.row as { sl_no: number }).sl_no.toString()) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 300,
      field: 'common_name',
      headerName: 'SPECIES',
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <SpeciesCard
          species={{
            common_name: (params.row as MortalityRow).common_name,
            scientific_name: (params.row as MortalityRow).scientific_name,
            default_icon: (params.row as MortalityRow).default_icon
          }}
        />
      )
    },
    {
      width: 250,
      field: 'identifier',
      headerName: 'IDENTIFIER',
      headerAlign: 'left' as const,
      align: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
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
          <IdentifierInfoCard
            animalId={(params.row as MortalityRow).animal_id}
            total={data?.data?.total_count || 0}
            localIdentifierName={(params.row as MortalityRow).local_identifier_name}
            localIdentifierValue={(params.row as MortalityRow).local_identifier_value}
          />
        </Box>
      )
    },
    {
      width: 250,
      field: 'animal_name',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      headerName: 'Primary Identifier',
      renderCell: (params: GridCellParams) => {
        const localIdentifierName = (params.row as MortalityRow).local_identifier_name
        const localIdentifierValue = (params.row as MortalityRow).local_identifier_value

        return localIdentifierName ? (
          <Typography
            sx={{
              fontSize: '16px',
              cursor: 'default',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {localIdentifierName} : {localIdentifierValue}
          </Typography>
        ) : (
          <Typography sx={{ ml: 10, cursor: 'default' }}>-</Typography>
        )
      }
    },

    {
      field: 'died_on',
      headerName: 'DIED ON',
      headerAlign: 'left' as const,
      align: 'left' as const,
      sortable: false,
      width: 250,
      renderCell: (params: GridCellParams) => (
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
          <DateInfoDisplay date={(params.row as MortalityRow).discovered_date} />
        </Box>
      )
    },
    {
      field: 'reported_on',
      headerName: 'REPORTED ON',
      headerAlign: 'left' as const,
      align: 'left' as const,
      sortable: false,
      width: 250,
      renderCell: (params: GridCellParams) => (
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
          <DateInfoDisplay date={(params.row as MortalityRow).discovered_date} />
        </Box>
      )
    },
    {
      width: 300,
      field: 'reason',
      headerName: 'REASON',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 400,
            cursor: 'default',
            color: theme.palette.customColors.OnSurfaceVariant,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}
        >
          {(params.row as MortalityRow).reason_name}
        </Typography>
      )
    }
  ]

  return (
    <>
      <ListingHeader title='Mortality' totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
          <Search
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search...'
            sx={{ justifyContent: 'flex-end' }}
          />
          {/* <ExportButton loading={downloading} onClick={handleDownload} /> */}
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
            searchValue={inputValue}
            maxHeight='80vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default MortalityListing
