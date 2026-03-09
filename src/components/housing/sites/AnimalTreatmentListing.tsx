import { useTheme } from '@emotion/react'
import { Box, Grid, Typography, Theme } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
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
import { GridCellParams, GridSortModel, GridRowParams } from '@mui/x-data-grid'

interface TreatmentFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface TreatmentRow {
  animal_id?: number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  local_identifier_name?: string
  local_identifier_value?: string
  sex?: string
  section_name?: string
  user_enclosure_name?: string
}

interface PaginationModel {
  page: number
  pageSize: number
}

interface GenderStyle {
  bgcolor: string
  color: string
}

const AnimalTreatmentListing: React.FC = () => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme() as Theme & { palette: any }

  const [downloading, setDownloading] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')

  const [filters, setFilters] = useState<TreatmentFilters>({
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
        site_id: Number(id),
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder as 'asc' | 'desc' | undefined
      }),
    enabled: !!id
  })

  const animalTreatmentList: TreatmentRow[] = data?.data?.result || []
  const total: number = data?.data?.total_count || 0

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows = animalTreatmentList.map((row, index) => ({
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
    // router.push({
    //   pathname: `/housing/sites/${params.row.site_id}`
    // })
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
      width: 350,
      field: 'common_name',
      headerName: 'SPECIES',
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <SpeciesCard
          species={{
            common_name: (params.row as TreatmentRow).common_name,
            scientific_name: (params.row as TreatmentRow).scientific_name,
            default_icon: (params.row as TreatmentRow).default_icon
          }}
        />
      )
    },

    {
      width: 250,
      field: 'identifier',
      headerName: 'ANTZ ANIMAL ID',
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
            animalId={(params.row as TreatmentRow).animal_id}
            total={total}
            localIdentifierName={(params.row as TreatmentRow).local_identifier_name}
            localIdentifierValue={(params.row as TreatmentRow).local_identifier_value}
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
        const localIdentifierName = (params.row as TreatmentRow).local_identifier_name
        const localIdentifierValue = (params.row as TreatmentRow).local_identifier_value

        return (
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
            {localIdentifierName ? (
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
            )}
          </Box>
        )
      }
    },

    {
      width: 160,
      field: 'sex',
      headerName: 'Gender',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const gender = (params.row as TreatmentRow).sex?.toLowerCase()

        // Define style mapping
        const genderStyles: Record<string, GenderStyle> = {
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
        const genderLabels: Record<string, string> = {
          male: 'M',
          female: 'F',
          undetermined: 'UD',
          indeterminate: 'ID'
        }

        const { bgcolor, color } = genderStyles[gender || ''] || genderStyles.indeterminate
        const label = genderLabels[gender || ''] || 'ID'

        return <GenderInfoCard value={label} bgcolor={bgcolor} color={color} />
      }
    },

    {
      width: 250,
      field: 'section_name',
      headerName: 'Section Name',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Typography
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            color: theme.palette.customColors.OnSurfaceVariant,
            cursor: 'default'
          }}
        >
          {(params.row as TreatmentRow).section_name}
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
      align: 'left' as const,
      headerAlign: 'left' as const,
      headerName: 'Enclosure Name',
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Typography
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            color: theme.palette.customColors.OnSurfaceVariant,
            cursor: 'default'
          }}
        >
          {(params.row as TreatmentRow).user_enclosure_name}
        </Typography>
      )
    }
  ]

  return (
    <>
      <ListingHeader title='Animals Under Treatment' totalCount={total} />
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
            '& .MuiDataGrid-cell': {
              pt: 4,
              py: 4, // vertical padding (theme spacing, equivalent to padding-top and padding-bottom)
              px: 4 // horizontal padding
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
            searchValue={inputValue}
            maxHeight='80vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default AnimalTreatmentListing
