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
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { ExportButton } from 'src/views/utility/render-snippets'
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

const SpeciesDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [searchValue, setSearchValue] = useState('')
  const [openFilter, setOpenFilter] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [filterDate, setFilterDate] = useState({})
  const [loading, setLoading] = useState(false)
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    q: '',
    sort: 'asc',
    column: ''
  })

  const [selectedOptions, setSelectedOptions] = useState({
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })

  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilter(false)
  }

  useEffect(() => {
    const { page = '1', limit = '50', q = '', column = '', sort = 'asc' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q,
      sort,
      column
    })

    setSearchValue(q)
  }, [router.query])

  const prepareFilterParams = key => {
    return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
  }

  const formatDate = dateString => {
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
        },
        id: id
      }),
    enabled: !!id
  })

  const total = data?.data?.total || 0
  const rows = data?.data?.records || []
  const speciesStats = data?.data?.species_stats || {}

  const statsData = [
    {
      label: 'Permitted Animals',
      value: speciesStats?.total_animals_permitted || 0
    },
    {
      label: 'Received Animals',
      value: speciesStats?.total_animals_received || 0
    },
    {
      label: 'Shipments',
      value: speciesStats?.total_shipments || 0
    },
    {
      label: 'Exports',
      value: speciesStats?.total_exports || 0
    },
    {
      label: 'Imports',
      value: speciesStats?.total_imports || 0
    }
  ]

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
  }

  const handlePaginationModelChange = model => {
    console.log(model, 'models')

    const updated = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        const updated = {
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
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSortModelChange = sortModel => {
    let updated
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      updated = {
        ...filters,
        column: field,
        sort: sort,
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

  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    id: +row?.shipment_id,
    sl_no: getSlNo(index)
  }))

  const columns = [
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
            {parseInt(params.row.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 220,
      field: 'shipment_number',
      headerName: 'SHIPMENT NUMBER',
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
          {params.row.shipment_number}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'shipment_date',
      headerName: 'SHIPMENT DATE',
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%' }}>{Utility.formatDisplayDate(params.row.shipment_date)}</Typography>
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
      const params = {
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
      await getSpeciesShipmentList({ params: params, id: id }).then(res => {
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
      <ExportButton onClick={handleReportExport} loading={loading} tooltip='Download Report' />
    </>
  )

  const handleRowClick = params => {
    setSelectedRow(params.row)
    setOpenDetailsDrawer(true)
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
        image={speciesStats?.default_icon}
        isSpecies={true}
        loading={isFetching}
        isSpeciesDetails={true}
        headerDetails={{ commonName: speciesStats?.common_name, scientificName: speciesStats?.scientific_name }}
        statsData={statsData}
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
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <CommonDateRangePickers
                  filterDates={filterDate}
                  onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
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
                    sx={{ height: '24px', width: '24px' }}
                    color={theme.palette.customColors.OnSurfaceVariant}
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
            <Grid item size={{ xs: 12 }}>
              <CommonTable
                onRowClick={handleRowClick}
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
          onSubmitLoading={loading}
          onApplyFilters={applyFilters}
          setFilterCount={setFilterCount}
          initialSelectedOptions={selectedOptions}
        />
      )}
      {openDetailsDrawer && (
        <SpeciesShipmentDetailsDrawer
          open={openDetailsDrawer}
          onClose={() => {
            setOpenDetailsDrawer(false)
            setSelectedRow(null)
          }}
          shipmentData={selectedRow}
          speciesStats={speciesStats}
        />
      )}
    </>
  )
}

export default SpeciesDetails
