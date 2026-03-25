import { useTheme } from '@emotion/react'
import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { debounce, DebouncedFunc } from 'lodash'
import { useRouter, NextRouter } from 'next/router'
import React, { useEffect, useMemo, useState, ChangeEvent } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import { getEnclosureListSectionWise } from 'src/lib/api/housing'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import type { GridSortModel, GridCellParams, GridColDef, GridRowParams } from '@mui/x-data-grid'

interface EnclosureFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: string
}

interface EnclosureRow {
  enclosure_id: number
  user_enclosure_name: string
  parent_enclosure_name?: string
  image?: string
  enclosure_wise_animal_count?: number
  sub_enclosure_count?: number
  site_name?: string
  species_count?: number
}

interface IndexedEnclosureRow extends EnclosureRow {
  id: number
  sl_no: number
}

interface PaginationModel {
  page: number
  pageSize: number
}

const EnclosureWiseEnclosure: React.FC = () => {
  const theme = useTheme() as any
  const router: NextRouter = useRouter()
  const { id } = router.query

  const [inputValue, setInputValue] = useState<string>('')
  const [downloading, setDownloading] = useState<boolean>(false)

  const [filters, setFilters] = useState<EnclosureFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  const { data, isLoading } = useQuery({
    queryKey: ['enclosure-wise-enclosure', id, filters],
    queryFn: () =>
      getEnclosureListSectionWise({
        enclosure_id: id as string,
        include_sub_enclosure: 1,
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder as 'asc' | 'desc' | undefined
      }),
    enabled: !!id
  })

  const listing: EnclosureRow[] = (data?.data as any)?.list_items || data?.data?.result || []
  const total: number = data?.data?.total_count || 0

  const updateUrlParams = (updatedFilters: EnclosureFilters): void => {
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

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedEnclosureRow[] = useMemo(
    () =>
      listing.map((row, index) => ({
        ...row,
        id: +row?.enclosure_id,
        sl_no: getSlNo(index)
      })),
    [listing, filters.page, filters.pageSize]
  )

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
    () =>
      debounce((value: string) => {
        const updated: EnclosureFilters = {
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

  const handleSearch = (value: string): void => {
    setInputValue(value)
    debouncedSearch(value)
  }

  const handleSortModelChange = (model: GridSortModel): void => {
    let updated: EnclosureFilters
    if (model.length > 0) {
      const { field, sort } = model[0]
      updated = {
        ...filters,
        sortBy: field,
        sortOrder: sort || 'asc',
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

  const handlePaginationModelChange = (model: PaginationModel): void => {
    const updated: EnclosureFilters = {
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
      search: (router.query.enclosureSearch as string) || '',
      sortBy: (router.query.enclosureSortBy as string) || '',
      sortOrder: (router.query.enclosureSortOrder as string) || 'asc'
    }))
    setInputValue((router.query.enclosureSearch as string) || '')
  }, [
    router.query.enclosurePage,
    router.query.enclosurePageSize,
    router.query.enclosureSearch,
    router.query.enclosureSortBy,
    router.query.enclosureSortOrder
  ])

  const columns: GridColDef[] = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: (params: GridCellParams) => (
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
      width: 330,
      field: 'user_enclosure_name',
      headerAlign: 'left',
      headerName: 'Enclosures',
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <SpeciesCard
          species={{
            common_name: params.row.user_enclosure_name,
            scientific_name: params.row.parent_enclosure_name ? `P. Encl: ${params.row.parent_enclosure_name}` : '',
            default_icon: params.row.image
          }}
        />
      )
    },
    ...(insightsViewAccess
      ? [
          // {
          //   width: 160,
          //   field: 'species_count',
          //   headerName: 'SPECIES',
          //   headerAlign: 'left',
          //   align: 'left',
          //   sortable: false,
          //   renderCell: params => (
          //     <Typography
          //       sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
          //     >
          //       {params.row.species_count || '-'}
          //     </Typography>
          //   )
          // },
          {
            width: 160,
            field: 'enclosure_wise_animal_count',
            headerName: 'ANIMALS',
            headerAlign: 'left' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Typography
                sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
              >
                {params.row.enclosure_wise_animal_count || 0}
              </Typography>
            )
          },
          {
            width: 160,
            field: 'sub_enclosure_count',
            headerName: 'SUB ENCLOSURES',
            headerAlign: 'left' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Typography
                sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
              >
                {params.row.sub_enclosure_count || 0}
              </Typography>
            )
          },
          {
            width: 250,
            field: 'site_name',
            headerName: 'SITE',
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Typography
                sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600, cursor: 'default' }}
              >
                {params.row.site_name || ''}
              </Typography>
            )
          }
        ]
      : [])
  ]

  const onRowClick = (params: GridRowParams): void => {
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
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
