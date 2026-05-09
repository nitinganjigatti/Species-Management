'use client'

import {
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  useTheme
} from '@mui/material'
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Search from 'src/views/utility/Search'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import SpeciesShipmentFilterDrawer from 'src/components/compliance/drawer/SpeciesShipmentFilterDrawer'
import { useQuery } from '@tanstack/react-query'
import { getSpeciesShipmentList } from 'src/lib/api/compliance/species'
import { debounce } from 'lodash'
import Utility from 'src/utility'
import SpeciesShipmentDetailsDrawer from 'src/components/compliance/drawer/SpeciesShipmentDetailsDrawer'
import Toaster from 'src/components/Toaster'
import AnimalInsightsCard from 'src/views/utility/insights/AnimalInsightsCard'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import SpeciesExportDrawer from 'src/components/compliance/drawer/SpeciesExportDrawer'
import SpeciesExportDocumentDrawer from 'src/components/compliance/drawer/SpeciesExportDocumentDrawer'
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

interface FilterDate {
  startDate?: string
  endDate?: string
}

interface SelectedRow {
  row: Record<string, unknown> | null
  type: string
}

const SpeciesDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const id = params?.id as string

  const [searchValue, setSearchValue] = useState<string>('')
  const [openFilter, setOpenFilter] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [filterDate, setFilterDate] = useState<FilterDate>({})
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState<boolean>(false)
  const [selectedRow, setSelectedRow] = useState<SelectedRow>({ row: null, type: '' })
  const [exportLoading, setExportLoading] = useState<boolean>(false)
  const [openExportDrawer, setOpenExportDrawer] = useState<boolean>(false)
  const [openDocumentDrawer, setOpenDocumentDrawer] = useState<boolean>(false)

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

  const formatDate = (dateString: string | undefined): string | null => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const { data, isFetching } = useQuery({
    queryKey: ['trade-species-shipment-details', filters, selectedOptions, id, filterDate],
    queryFn: () =>
      getSpeciesShipmentList({
        params: {
          page: filters.page,
          limit: filters.limit,
          q: filters.q,
          sort: filters.sort,
          column: filters.column,
          exporting_country: prepareFilterParams('Exporting country'),
          exporter: prepareFilterParams('Exporter'),
          importer: prepareFilterParams('Importer'),
          missing_docs: prepareFilterParams('Documents'),
          from_date: formatDate(filterDate.startDate),
          to_date: formatDate(filterDate.endDate)
        } as any,
        id: id as string
      }),
    enabled: !!id
  })

  const total: number = (data?.data as any)?.total || data?.data?.total_count || 0
  const rows: Record<string, unknown>[] = (data?.data?.records || []) as Record<string, unknown>[]
  const speciesStats: Record<string, unknown> = (data?.data as any)?.species_stats || {}

  const statsData = [
    {
      label: 'Permitted Animals',
      value: (speciesStats?.total_animals_permitted as number) || 0
    },
    {
      label: 'Received Animals',
      value: (speciesStats?.total_animals_received as number) || 0
    },
    {
      label: 'Shipments',
      value: (speciesStats?.total_shipments as number) || 0
    },
    {
      label: 'Exports',
      value: (speciesStats?.total_exports as number) || 0
    },
    {
      label: 'Imports',
      value: (speciesStats?.total_imports as number) || 0
    }
  ]

  const updateUrlParams = (updatedFilters: SpeciesFilters) => {
    const urlParams = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value.toString())
      }
    })
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
    id: +(row?.shipment_id as string | number),
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef[] = [
    {
      minWidth: 100,
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
            {parseInt(params.row.sl_no as string) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 220,
      field: 'shipment_number',
      headerName: 'SHIPMENT ID',
      sortable: true,
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <Typography
          sx={{
            cursor: 'pointer',
            px: 2,
            width: '100%'
          }}
        >
          {params.row.shipment_number as string}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'shipment_date',
      headerName: 'SHIPMENT DATE',
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%' }}>
          {Utility.formatDisplayDate(params.row.shipment_date as string)}
        </Typography>
      )
    },
    {
      minWidth: 180,
      field: 'total_exports',
      headerName: 'EXPORTS',
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              px: 2
            }}
          >
            {params.row.total_exports ? params.row.total_exports : '-'}
          </Typography>
        </>
      )
    },
    {
      minWidth: 180,
      field: 'total_animals',
      headerName: 'ANIMALS',
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              px: 2
            }}
          >
            {params.row.total_animals ? params.row.total_animals : '-'}
          </Typography>
        </>
      )
    },
    {
      minWidth: 180,
      field: 'total_documents',
      headerName: 'DOCUMENTS',
      align: 'left',
      headerAlign: 'left',
      sortable: true,
      renderCell: params => (
        <>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              px: 2
            }}
          >
            {params.row.total_documents ? params.row.total_documents : '-'}
          </Typography>
        </>
      )
    }
  ]

  const handleReportExport = async () => {
    setExportLoading(true)
    try {
      const exportParams = {
        page: filters.page,
        limit: filters.limit,
        q: filters.q,
        sort: filters.sort,
        column: filters.column,
        exporting_country: prepareFilterParams('Exporting country'),
        exporter: prepareFilterParams('Exporter'),
        importer: prepareFilterParams('Importer'),
        missing_docs: prepareFilterParams('Documents'),
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        response_type: 'csv'
      }
      await getSpeciesShipmentList({ params: exportParams as any, id: id as string }).then(res => {
        if (res?.success === true) {
          Utility.downloadFileFromURL(res.data, `Species Shipment Report`)
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
    <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.customTextColorGray2 }}>
      Animal Shipment
    </Typography>
  )

  const headerAction = (
    <>
      <DownloadReport isDownloading={exportLoading} handleDownloadReport={handleReportExport} />
    </>
  )

  const handleCellClick = (params: { field: string; row: Record<string, unknown> }) => {
    if (params?.field === 'total_animals') {
      setSelectedRow({ row: params?.row, type: 'total_animals' })
      setOpenExportDrawer(true)
    } else if (params?.field === 'sl_no' || params?.field === 'shipment_number' || params?.field === 'shipment_date') {
      setSelectedRow({ row: params?.row, type: 'shipment_number' })
      setOpenDetailsDrawer(true)
    } else if (params?.field === 'total_documents') {
      setSelectedRow({ row: params?.row, type: 'total_documents' })
      setOpenDocumentDrawer(true)
    } else if (params?.field === 'total_exports') {
      setSelectedRow({ row: params?.row, type: 'total_exports' })
      setOpenExportDrawer(true)
    }
  }

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Compliance</Typography>
        <Typography onClick={() => router.back()} sx={{ cursor: 'pointer', color: 'inherit' }}>
          Species
        </Typography>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Species Details</Typography>
      </Breadcrumbs>
      <AnimalInsightsCard
        image={speciesStats?.default_icon as string}
        isSpecies={true}
        loading={isFetching}
        isSpeciesDetails={true}
        isAnimalDetailsPage={false}
        isSpeciesListing={false}
        onAddNew={() => {}}
        onQrClick={() => {}}
        showQr={false}
        headerDetails={{
          commonName: speciesStats?.common_name as string,
          scientificName: speciesStats?.scientific_name as string
        }}
        statsData={statsData as any}
      />
      <Card sx={{ mt: 4 }}>
        <CardHeader title={headerTitle} action={headerAction} />
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: 4,
              flexWrap: 'wrap'
            }}
          >
            <Search
              placeholder='Search exports...'
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <CommonDateRangePickers
                  filterDates={filterDate}
                  onChange={(s: string, e: string) => setFilterDate({ startDate: s, endDate: e })}
                />
              </Box>
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
          <Grid container columnSpacing={4} rowSpacing={1} alignItems='center'>
            <Grid size={{ xs: 12 }}>
              <CommonTable
                onCellClick={handleCellClick}
                columns={columns}
                indexedRows={indexedRows}
                total={total}
                pageSizeOptions={[10]}
                loading={isFetching}
                paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                setPaginationModel={handlePaginationModelChange}
                handleSortModel={handleSortModelChange}
                searchValue=''
              />
            </Grid>
          </Grid>
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
      {openDetailsDrawer && (
        <SpeciesShipmentDetailsDrawer
          open={openDetailsDrawer}
          onClose={() => {
            setOpenDetailsDrawer(false)
            setSelectedRow({ row: null, type: '' })
          }}
          speciesId={id as string}
          shipmentId={selectedRow?.row?.shipment_id as string}
        />
      )}
      {openExportDrawer && (
        <SpeciesExportDrawer
          open={openExportDrawer}
          onClose={() => {
            setOpenExportDrawer(false)
            setSelectedRow({ row: null, type: '' })
          }}
          speciesId={id as string}
          shipmentId={selectedRow?.row?.shipment_id as string}
          shipmentNumber={selectedRow?.row?.shipment_number as string}
          type={selectedRow?.type}
        />
      )}
      {openDocumentDrawer && (
        <SpeciesExportDocumentDrawer
          open={openDocumentDrawer}
          onClose={() => {
            setOpenDocumentDrawer(false)
            setSelectedRow({ row: null, type: '' })
          }}
          shipmentId={selectedRow?.row?.shipment_id as string}
          shipmentNumber={selectedRow?.row?.shipment_number as string}
        />
      )}
    </>
  )
}

export default SpeciesDetails
