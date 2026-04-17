import { useTheme, Theme } from '@emotion/react'
import { Box, Grid, Typography } from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useEffect, useMemo, useState, ChangeEvent } from 'react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import Search from 'src/views/utility/Search'

// import { fetchMortality, setParams } from 'src/store/slices/housing/speciesSlice'
import { ExportButton } from 'src/views/utility/render-snippets'
import { debounce, DebouncedFunc } from 'lodash'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { GenderInfoCard, IdentifierInfoCard } from 'src/utility/render'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import { getAnimalTreatmentList, getSectionAnimalTreatmentList } from 'src/lib/api/housing'
import { useQuery } from '@tanstack/react-query'
import type { GridSortModel, GridCellParams, GridColDef, GridRowParams } from '@mui/x-data-grid'
import { useTranslation } from 'react-i18next'

interface TreatmentFilters {
  page: number
  pageSize: number
  search: string
  sortBy: string
  sortOrder: string
}

interface TreatmentRow {
  animal_id: number
  common_name?: string
  scientific_name?: string
  default_icon?: string
  local_identifier_name?: string
  local_identifier_value?: string
  sex?: string
  section_name?: string
  user_enclosure_name?: string
}

interface IndexedTreatmentRow extends TreatmentRow {
  id: number
  sl_no: number
}

interface PaginationModel {
  page: number
  pageSize: number
}

interface GenderStyles {
  bgcolor: string
  color: string
}

interface GenderStylesMap {
  [key: string]: GenderStyles
}

interface GenderLabelsMap {
  [key: string]: string
}

const AnimalTreatmentListing: React.FC = () => {
  const { t } = useTranslation()
  const router: any = useSafeRouter()
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
      getSectionAnimalTreatmentList({
        section_id: Number(id),
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder as 'asc' | 'desc' | undefined
      }),
    enabled: !!id
  })

  const animalTreatmentList: TreatmentRow[] = (data?.data?.result || []) as unknown as TreatmentRow[]
  const total: number = data?.data?.total_count || 0

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedTreatmentRow[] = animalTreatmentList.map((row, index) => ({
    ...row,
    id: +row?.animal_id,
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
        sortOrder: sort || 'asc',
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

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
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
    router.push(`/animals/${params.row.animal_id}`)
  }

  const columns: GridColDef[] = [
    {
      width: 90,
      field: 'sl_no',
      headerName: t('s_no') as string,
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
          <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
            {parseInt(params.row.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },

    {
      width: 350,
      field: 'common_name',
      headerName: t('species') as string,
      headerAlign: 'left',
      align: 'left',
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
          <SpeciesCard
            species={{
              common_name: params.row.common_name,
              scientific_name: params.row.scientific_name,
              default_icon: params.row.default_icon
            }}
          />
        </Box>
      )
    },

    {
      width: 250,
      field: 'identifier',
      headerName: t('housing_module.antz_animal_id') as string,
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
            animalId={params.row.animal_id}
            total={total}
            localIdentifierName={params.row.local_identifier_name}
            localIdentifierValue={params.row.local_identifier_value}
          />
        </Box>
      )
    },

    {
      width: 250,
      field: 'animal_name',
      align: 'left',
      headerAlign: 'left',
      sortable: false,
      headerName: t('housing_module.primary_identifier') as string,
      renderCell: (params: GridCellParams) => {
        const localIdentifierName = params.row.local_identifier_name
        const localIdentifierValue = params.row.local_identifier_value

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
      headerName: t('housing_module.gender') as string,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const gender: string = params.row.sex?.toLowerCase() || ''

        // Define style mapping
        const genderStyles: GenderStylesMap = {
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
        const genderLabels: GenderLabelsMap = {
          male: 'M',
          female: 'F',
          undetermined: 'UD',
          indeterminate: 'ID'
        }

        const { bgcolor, color } = genderStyles[gender] || genderStyles.indeterminate
        const label = genderLabels[gender] || 'ID'

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
            <GenderInfoCard value={label} bgcolor={bgcolor} color={color} />
          </Box>
        )
      }
    },

    {
      width: 250,
      field: 'section_name',
      headerName: t('housing_module.section_name') as string,
      headerAlign: 'left',
      align: 'left',
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
          <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
            {params.row.section_name}
          </Typography>
        </Box>
      )
    },

    {
      width: 250,
      field: 'user_enclosure_name',
      headerName: t('housing_module.enclosure_name') as string,
      headerAlign: 'left',
      align: 'left',
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
          <Typography sx={{ fontWeight: 400, fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
            {params.row.user_enclosure_name}
          </Typography>
        </Box>
      )
    }
  ]

  return (
    <>
      <ListingHeader title={t('housing_module.animals_under_treatment')} totalCount={total} />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
          <Search
            value={inputValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder={t('search') as string}
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
