import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react'
import { Card, CardHeader, Grid, Box, Breadcrumbs, Typography, IconButton, Tooltip } from '@mui/material'

// import { AddButton } from 'src/components/Buttons'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'

// import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
// import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { debounce } from 'lodash'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import { useForm } from 'react-hook-form'
import { AddButtonContained } from 'src/components/ButtonContained'
import { useRouter } from 'next/router'
import { getExportCountries, getSpecies, getExportList } from 'src/lib/api/compliance/exports'
import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import countryList from 'react-select-country-list'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import RenderUtility from 'src/utility/render'
import { useTheme } from '@mui/material/styles'
import withModuleAccess from 'src/components/ProtectedRoute'

const CitesExportPermitIndex = () => {
  const { userData } = useContext(AuthContext)
  const router = useRouter()
  const canEdit = userData?.roles?.settings?.cites_export_permit_module === 'EDIT' || true

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [sortModel, setSortModel] = useState([])
  const [filterDate, setFilterDate] = useState({})
  const [countryOptions, setCountryOptions] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const [selectedExportingCountry, setSelectedExportingCountry] = useState(null)

  const theme = useTheme()

  const { control, watch } = useForm({
    defaultValues: {
      exportingCountry: null,
      countryOfOrigin: null,
      status: null
    }
  })

  const selectedCountryOfOrigin = watch('countryOfOrigin')
  const selectedStatus = watch('status')

  const countryListOptions = useMemo(() => countryList().getData(), [])

  const fetchStatuses = async () => {
    try {
      const res = await getSpecies()
      if (res.success) setStatusOptions(res.data)
    } catch (error) {
      console.error('Error fetching statuses:', error)
    }
  }

  const fetchExportPermits = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        q: searchValue,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sort: sortModel?.[0]?.sort,
        sortBy: sortModel?.[0]?.field,
        from_date: filterDate.startDate,
        to_date: filterDate.endDate,
        exporting_country: selectedExportingCountry?.value

        // country_of_origin: selectedCountryOfOrigin?.value,
        // status: selectedStatus?.value
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
  }, [
    searchValue,
    paginationModel,
    sortModel,
    filterDate,
    selectedExportingCountry,
    selectedCountryOfOrigin,
    selectedStatus
  ])

  useEffect(() => {
    fetchExportPermits()
  }, [fetchExportPermits])

  const debouncedSearch = useCallback(
    debounce(val => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleSearch = val => {
    debouncedSearch(val)
  }

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
      flex: 0.1,
      minWidth: 120,
      field: 'updated_by_user_name',
      headerName: 'Updated By',
      renderCell: params => (
        <Box sx={{ px: 2, width: '100%' }}>
          {RenderUtility.renderUserAvatarDetails(
            params.row.updated_user_profile_pic,
            params.row.updated_by_user_name,
            '',
            theme.palette.customColors.OnSurfaceVariant,
            '14px'
          )}
        </Box>
      )
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'created_at',
      headerName: 'Created At',
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%' }}>{Utility.formatDisplayDate(params.value)}</Typography>
      )
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'updated_at',
      headerName: 'Updated At',
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%' }}>{Utility.formatDisplayDate(params.value)}</Typography>
      )
    }
  ]

  // {
  //   flex: 0.1,
  //   minWidth: 120,
  //   field: 'actions',
  //   headerName: 'ACTIONS',
  //   sortable: false,
  //   renderCell: params => (
  //     <Box
  //       sx={{
  //         display: 'flex',
  //         justifyContent: 'center',
  //         px: 2,
  //         width: '100%'
  //       }}
  //     >
  //       {canEdit && (
  //         <IconButton
  //           size='small'
  //           onClick={() => router.push(`/compliance/documents/exports/AddEditExportPermit?id=${params.row.id}`)}
  //           aria-label='Edit'
  //           sx={{ mx: 0.5 }}
  //         >
  //           <Icon icon='mdi:pencil-outline' />
  //         </IconButton>
  //       )}
  //       <IconButton
  //         size='small'
  //         onClick={() => router.push(`/compliance/documents/exports/AddEditExportPermit?id=${params.row.id}`)}
  //         aria-label='View'
  //         sx={{ mx: 0.5 }}
  //       >
  //         <Icon icon='mdi:eye-outline' />
  //       </IconButton>
  //     </Box>
  //   )
  // }

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
          <Grid size={{ xs: 12, md: 4 }}>
            <Search
              placeholder='Search exports...'
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}></Grid>

          <Grid size={{ xs: 12, md: 4.5 }}>
            <CommonDateRangePickers
              filterDates={filterDate}
              onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <ControlledAutocomplete
              name='exportingCountry'
              label='Exporting Country'
              control={control}
              errors={{}}
              options={countryListOptions}
              onChangeOverride={value => {
                if (value) setSelectedExportingCountry(value)
                else setSelectedExportingCountry(null)
              }}
              getOptionLabel={o => o.label}
              isOptionEqualToValue={(o, v) => o.value === v.value}
              textFieldProps={{
                size: 'small',
                InputProps: {
                  sx: { fontSize: '0.875rem', height: 40 }
                },
                InputLabelProps: {
                  sx: { fontSize: '0.875rem' }
                }
              }}
            />
          </Grid>

          {/* <Grid size={{ xs: 12, md: 2.5 }}>
            <ControlledAutocomplete
              name='countryOfOrigin'
              label='Country of Origin'
              control={control}
              errors={{}}
              options={countryOptions}
              getOptionLabel={o => o.label}
              isOptionEqualToValue={(o, v) => o.value === v.value}
              textFieldProps={{
                size: 'small',
                InputProps: {
                  sx: { fontSize: '0.875rem', height: 40 }
                },
                InputLabelProps: {
                  sx: { fontSize: '0.875rem' }
                }
              }}
            />
          </Grid> */}

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
    </>
  )
}

export default withModuleAccess(CitesExportPermitIndex, 'compliance_module')
