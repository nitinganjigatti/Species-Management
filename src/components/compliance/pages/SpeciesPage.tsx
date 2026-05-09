'use client'

import { Badge, Box, Breadcrumbs, Button, Card, CardContent, CardHeader, Typography, useTheme } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import SpeciesShipmentFilterDrawer from 'src/components/compliance/drawer/SpeciesShipmentFilterDrawer'
import { getSpeciesData } from 'src/lib/api/compliance/species'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import SpeciesCard from 'src/views/utility/SpeciesCard'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'
import Toaster from 'src/components/Toaster'
import { GridColDef, GridSortModel } from '@mui/x-data-grid'

interface SpeciesFilters {
  page: number
  limit: number
  q: string
  sort: string
  column: string
}

interface SelectedOptions {
  'Exporting country': string[]
  Exporter: string[]
  Importer: string[]
  Documents: string[]
}

const Species = () => {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [searchValue, setSearchValue] = useState<string>('')
  const [exportLoading, setExportLoading] = useState<boolean>(false)

  const [filters, setFilters] = useState<SpeciesFilters>({
    page: 1,
    limit: 50,
    q: '',
    sort: 'asc',
    column: ''
  })

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })
  const [filterCount, setFilterCount] = useState<number>(0)
  const [openFilter, setOpenFilter] = useState<boolean>(false)

  const applyFilters = (opts: SelectedOptions) => {
    setSelectedOptions(opts)
    setOpenFilter(false)
  }

  useEffect(() => {
    const page = searchParams?.get('page') || '1'
    const limit = searchParams?.get('limit') || '50'
    const q = searchParams?.get('q') || ''
    const column = searchParams?.get('column') || ''
    const sort = searchParams?.get('sort') || 'asc'

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q,
      sort,
      column
    })

    setSearchValue(q)
  }, [searchParams])

  const prepareFilterParams = (key: keyof SelectedOptions): string | undefined => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const { data, isFetching } = useQuery({
    queryKey: ['trade-species', filters, selectedOptions],
    queryFn: () =>
      getSpeciesData({
        page: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        sort: filters?.sort,
        column: filters?.column,
        exporting_country: prepareFilterParams('Exporting country'),
        exporter: prepareFilterParams('Exporter'),
        importer: prepareFilterParams('Importer'),
        missing_docs: prepareFilterParams('Documents')
      })
  })

  const total: number = (data?.data as any)?.total || data?.data?.total_count || 0
  const rows: Record<string, unknown>[] = data?.data?.records || []

  const updateUrlParams = (updatedFilters: SpeciesFilters) => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    console.log(model, 'models')

    const updated: SpeciesFilters = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        const updated: SpeciesFilters = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters]
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSortModelChange = (sortModel: GridSortModel) => {
    let updated: SpeciesFilters
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      updated = {
        ...filters,
        column: field,
        sort: sort as string,
        page: 1
      }
    } else {
      updated = {
        ...filters,
        column: '',
        sort: 'asc'
      }
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const getSlNo = (index: number) => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: +(row?.species_id as string | number),
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef[] = [
    {
      width: 100,
      field: 'sl_no',
      headerName: 'SL.NO',
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
            {parseInt(params.row?.sl_no as string) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'common_name',
      headerName: 'SPECIES',
      width: 350,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <>
          <Box sx={{ px: 2, py: 2 }}>
            <SpeciesCard
              species={{
                common_name: params.row?.common_name,
                scientific_name: params.row?.scientific_name,
                default_icon: params.row?.default_icon || '/images/branding/antz/Antz_logomark_h_color.svg'
              }}
            />
          </Box>
        </>
      )
    },
    {
      field: 'total_shipments',
      headerName: 'SHIPMENTS',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            px: 2
          }}
        >
          {params.row?.total_shipments ? params.row?.total_shipments : '-'}
        </Typography>
      )
    },
    {
      field: 'total_exports',
      headerName: 'EXPORTS',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            px: 2
          }}
        >
          {params.row?.total_exports ? params.row?.total_exports : '-'}
        </Typography>
      )
    },
    {
      field: 'total_animals_permitted',
      headerName: 'PERMITTED ANIMALS',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            px: 2
          }}
        >
          {params.row?.total_animals_permitted ? params.row?.total_animals_permitted : '-'}
        </Typography>
      )
    },
    {
      field: 'total_animals_received',
      headerName: 'RECEIVED ANIMALS',
      width: 200,
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: 400,
            px: 2
          }}
        >
          {params.row?.total_animals_received ? params.row?.total_animals_received : '-'}
        </Typography>
      )
    }
  ]

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params = {
        page: filters?.page,
        limit: filters?.limit,
        q: filters?.q,
        sort: filters?.sort,
        column: filters?.column,
        exporting_country: prepareFilterParams('Exporting country'),
        exporter: prepareFilterParams('Exporter'),
        importer: prepareFilterParams('Importer'),
        missing_docs: prepareFilterParams('Documents'),
        response_type: 'csv'
      }

      await getSpeciesData(params).then(res => {
        if (res?.success === true) {
          Utility.downloadFileFromURL(res.data, `Species Report`)
          Toaster({ type: 'success', message: res?.message })
          setExportLoading(false)
        } else {
          Toaster({ type: 'error', message: res?.message })
        }
      })
    } catch (error) {
      console.error('Error exporting report:', error)
      setExportLoading(false)
    }
  }

  const headerTitle = (
    <Typography sx={{ fontSize: '24px', fontWeight: 500, color: theme.palette.customColors.customTextColorGray2 }}>
      Species
    </Typography>
  )

  const handleRowClick = (params: { row: Record<string, unknown> }) => {
    router.push(`/compliance/species/${params.row?.species_id}`)
  }

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Compliance</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Species</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title={headerTitle} />
        <CardContent>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Search value={searchValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                <ExportButton loading={exportLoading} tooltip='Download Report' onClick={handleExport} bgcolor={undefined} />
                <Button
                  variant='outlined'
                  sx={{
                    color: theme.palette.customColors.OnSurfaceVariant,
                    borderColor: theme.palette.customColors.OutlineVariant,
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  startIcon={
                    <TuneRoundedIcon
                      sx={{ height: '24px', width: '24px', color: theme.palette.customColors.OnSurfaceVariant }}
                    />
                  }
                  endIcon={
                    <Badge
                      badgeContent={filterCount}
                      color='primary'
                      invisible={filterCount === 0}
                      sx={{ ml: 2, mr: 2 }}
                    />
                  }
                  onClick={() => setOpenFilter(true)}
                >
                  Filter
                </Button>
              </Box>
            </Box>
            <CommonTable
              columns={columns}
              indexedRows={indexedRows}
              total={total}
              pageSizeOptions={[10]}
              loading={isFetching}
              paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
              setPaginationModel={handlePaginationModelChange}
              handleSortModel={handleSortModelChange}
              searchValue=''
              onRowClick={handleRowClick}
            />
          </Box>
        </CardContent>
      </Card>
      {openFilter && (
        <SpeciesShipmentFilterDrawer
          open={openFilter}
          onClose={() => setOpenFilter(false)}
          onApplyFilters={applyFilters as any}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions as any}
        />
      )}
    </>
  )
}

export default Species
