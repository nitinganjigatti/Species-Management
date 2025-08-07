import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardHeader, Grid, Box, Breadcrumbs, Typography, Tooltip, Button, Badge } from '@mui/material'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import { AddButtonContained } from 'src/components/ButtonContained'
import { useRouter } from 'next/router'
import { getExportList } from 'src/lib/api/compliance/exports'
import Utility from 'src/utility'
import countryList from 'react-select-country-list'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import RenderUtility from 'src/utility/render'
import { useTheme } from '@mui/material/styles'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import FiltersDrawer from 'src/components/compliance/drawer/FiltersDrawer'

const CitesExportPermitIndex = () => {
  const router = useRouter()

  // Table and main data states
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sortModel, setSortModel] = useState([])
  const [filterDate, setFilterDate] = useState({})

  // Filter states
  const [filterCount, setFilterCount] = useState(0)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState({
    Species: [],
    'Exporting country': [],
    Exporter: [],
    Importer: [],
    Documents: []
  })

  const theme = useTheme()
  const countryListOptions = useMemo(() => countryList().getData(), [])

  const fetchExportPermits = useCallback(async () => {
    setLoading(true)
    try {
      const formatDate = dateString => {
        if (!dateString) return null

        return new Date(dateString).toISOString().split('T')[0]
      }

      const prepareFilterParams = key => {
        return selectedOptions[key]?.length > 0 ? selectedOptions[key].join(',') : undefined
      }

      const params = {
        q: searchValue,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sort: sortModel?.[0]?.sort,
        sortBy: sortModel?.[0]?.field,
        from_date: formatDate(filterDate.startDate),
        to_date: formatDate(filterDate.endDate),
        species: prepareFilterParams('Species'),
        exporting_country: prepareFilterParams('Exporting country'),
        exporter: prepareFilterParams('Exporter'),
        importer: prepareFilterParams('Importer'),
        missing_docs: prepareFilterParams('Documents')
      }

      const res = await getExportList(params)
      const start = paginationModel.page * paginationModel.pageSize
      setRows(
        res.data.records.map((r, i) => ({
          ...r,
          uid: start + i + 1,
          export_number: r.export_number || '-',
          exporter_name: r.exporter_name || '-',
          exporting_country: r.exporting_country || '-',
          country_of_origin: r.country_of_origin || '-',
          species_count: r.species_count || '-',
          animal_count: r.animal_count || '-',
          documents_count: r.documents_count || '-',
          shipments_count: r.shipments_count || '-',
          expiry_date: r.expiry_date || '-'
        }))
      )
      setTotal(res.data.total)
    } catch (error) {
      console.error('Error fetching export permits:', error)
      Toaster({ type: 'error', message: 'Failed to fetch export permits' })
    }
    setLoading(false)
  }, [searchValue, paginationModel, sortModel, filterDate, selectedOptions])

  useEffect(() => {
    fetchExportPermits()
  }, [fetchExportPermits])

  // Apply filters
  const applyFilters = selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  // Main search handler
  const debouncedMainSearch = useCallback(
    debounce(val => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleMainSearch = val => {
    debouncedMainSearch(val)
  }

  const handleFilterDrawerOpen = async () => {
    setOpenFilterDrawer(true)
  }

  // Columns definition (same as before)
  const columns = [
    {
      flex: 0.12,
      minWidth: 150,
      field: 'export_number',
      headerName: 'Export ID',
      renderCell: params => (
        <Typography
          sx={{
            cursor: 'pointer',
            px: 2,
            width: '100%'
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      flex: 0.15,
      minWidth: 180,
      field: 'exporter_name',
      headerName: 'EXPORTER',
      renderCell: params => (
        <Tooltip title={params.value || ''}>
          <Typography
            sx={{
              px: 2,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'default'
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.15,
      minWidth: 180,
      field: 'exporting_country',
      headerName: 'EXPORTING COUNTRY',
      renderCell: params => (
        <Tooltip title={countryListOptions.find(country => country.value === params.value)?.label || ''}>
          <Typography
            sx={{
              px: 2,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'default'
            }}
          >
            {countryListOptions.find(country => country.value === params.value)?.label || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.15,
      minWidth: 180,
      field: 'origin_country',
      headerName: 'COUNTRY OF ORIGIN',
      renderCell: params => (
        <Tooltip title={countryListOptions.find(country => country.value === params.value)?.label || ''}>
          <Typography
            sx={{
              px: 2,
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'default'
            }}
          >
            {countryListOptions.find(country => country.value === params.value)?.label || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'species_count',
      headerName: 'SPECIES',
      renderCell: params => <Typography sx={{ px: 2, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'animal_count',
      headerName: 'ANIMALS',
      renderCell: params => <Typography sx={{ px: 2, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'documents_count',
      headerName: 'DOCUMENTS',
      renderCell: params => <Typography sx={{ px: 2, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'shipment_count',
      headerName: 'SHIPMENTS',
      renderCell: params => <Typography sx={{ px: 2, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'valid_until',
      headerName: 'EXPIRY',
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%' }}>{Utility.formatDisplayDate(params.value)}</Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 180,
      field: 'created_by_user_name',
      headerName: 'Created By',
      renderCell: params => (
        <Box sx={{ px: 2 }}>
          {params.row.created_by_user_name
            ? RenderUtility.renderUserAvatarDetails(
                params.row.created_user_profile_pic,
                params.row.created_by_user_name,
                Utility.formatDisplayDate(params.row.created_at),
                theme.palette.customColors.OnSurfaceVariant,
                '14px'
              )
            : null}
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 180,
      field: 'updated_by_user_name',
      headerName: 'Updated By',
      renderCell: params => (
        <Box sx={{ px: 2 }}>
          {params.row.updated_by_user_name
            ? RenderUtility.renderUserAvatarDetails(
                params.row.updated_user_profile_pic,
                params.row.updated_by_user_name,
                Utility.formatDisplayDate(params.row.updated_at),
                theme.palette.customColors.OnSurfaceVariant,
                '14px'
              )
            : null}
        </Box>
      )
    }
  ]

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Compliance</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>CITES Export Permit</Typography>
      </Breadcrumbs>

      <Card>
        <CardHeader
          title={<Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>Export Documents</Typography>}
          action={
            <AddButtonContained
              title='ADD NEW'
              action={() => router.push('/compliance/documents/exports/AddEditExportPermit')}
            />
          }
        />

        <Grid container columnSpacing={4} rowSpacing={1} sx={{ px: 5, pt: 2 }} alignItems='center'>
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
              onChange={e => handleMainSearch(e.target.value)}
              onClear={() => handleMainSearch('')}
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
                onClick={handleFilterDrawerOpen}
              >
                Filter
              </Button>
            </Box>
          </Box>

          <Grid size={{ xs: 12 }}>
            <CommonTable
              onRowClick={row => router.push(`/compliance/documents/exports/${row.id}?id=${row.id}`)}
              columns={columns}
              indexedRows={rows}
              total={total}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={newModel => setSortModel(newModel)}
              loading={loading}
            />
          </Grid>
        </Grid>
      </Card>
      <FiltersDrawer
        openFilterDrawer={openFilterDrawer}
        onCloseFilterDrawer={() => setOpenFilterDrawer(false)}
        onSubmitLoading={loading}
        onApplyFilters={applyFilters}
        setFilterCount={setFilterCount}
        initialSelectedOptions={selectedOptions}
        contextId={'1'} // Don't include this prop as i am having dependency i am using it
      />
    </>
  )
}

export default enforceModuleAccess(CitesExportPermitIndex, 'compliance_module')
