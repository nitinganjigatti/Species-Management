import React, { useState, useCallback, useEffect } from 'react'
import { Badge, Box, Breadcrumbs, Button, Card, CardHeader, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import Router from 'next/router'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Search from 'src/views/utility/Search'
import { AddButtonContained } from 'src/components/ButtonContained'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import { getShipmentList } from 'src/lib/api/compliance/shipment'
import moment from 'moment'
import RenderUtility from 'src/utility/render'
import Utility from 'src/utility'
import { useTheme } from '@mui/material/styles'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import FiltersDrawer from 'src/components/compliance/drawer/FiltersDrawer'

const ShipmentPage = () => {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [selectedId, setSelectedId] = useState(null)
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

  // Apply filters
  const applyFilters = async selectedOptions => {
    setSelectedOptions(selectedOptions)
    setOpenFilterDrawer(false)
  }

  const handleFilterDrawerOpen = async () => {
    setOpenFilterDrawer(true)
  }

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
        q: searchValue.replace(/[\s-]+/g, ''),
        page: paginationModel.page + 1,
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
      const res = await getShipmentList(params)
      const start = paginationModel.page * paginationModel.pageSize
      setRows(
        res.data.records.map((r, i) => ({
          ...r,
          uid: start + i + 1,
          shipment_number: r.shipment_number || '-',
          shipment_state: r.shipment_state || '-',
          shipment_date: r.shipment_date || '-',
          export_count: r.export_count || '-',
          species_count: r.species_count || '-',
          animal_counts: r.animal_counts || '-',
          documents_count: r.documents_count || '-'
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

  const debouncedSearch = useCallback(
    debounce(val => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleSearch = val => {
    debouncedSearch(val)
  }

  const handleRowClick = params => {
    setSelectedId(params.row.id)

    Router.push(
      `/compliance/documents/shipments/AddEditShipment/?id=${params.row.id}&action=details&export=${params.row.export_count}`
    )
  }

  const columns = [
    {
      flex: 0.12,
      minWidth: 300,
      field: 'shipment_number',
      headerName: 'Shipment ID',
      renderCell: params => {
        const rawValue = params.value || ''
        const removeSpaceValue = rawValue.replace(/\s+/g, '') // remove all spaces

        const formattedValue =
          removeSpaceValue.length > 3
            ? `${removeSpaceValue.slice(0, 3)} - ${removeSpaceValue.slice(3)}`
            : removeSpaceValue

        return (
          <Typography
            sx={{
              cursor: 'pointer',
              px: 3,
              width: '100%'
            }}

            //onClick={() => router.push(`/compliance/documents/exports/${params.row.id}`)}
          >
            {formattedValue}
          </Typography>
        )
      }
    },
    {
      flex: 0.03,
      minWidth: 60,
      field: 'shipment_state',
      headerName: '',
      renderCell: params => (
        <>
          <Box
            component='span'
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              display: 'inline-block',
              backgroundColor:
                params.value === 'draft'
                  ? theme.palette.customColors.antzNotes80
                  : params.value === 'completed'
                  ? theme.palette.customColors.PrimaryContainer
                  : '',
              ml: 3
            }}
          />
        </>
      )
    },
    {
      flex: 0.15,
      minWidth: 150,
      field: 'shipment_date',
      headerName: 'Shipment Date',
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%' }}>
          {params.value !== null ? moment(params.value).format('DD MMM YYYY') : '-'}
        </Typography>
      )
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'export_count',
      headerName: 'EXPORTS',
      renderCell: params => <Typography sx={{ px: 3, width: '100%' }}>{params.value}</Typography>
    },

    {
      flex: 0.08,
      minWidth: 100,
      field: 'species_count',
      headerName: 'SPECIES',
      renderCell: params => <Typography sx={{ px: 3, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'animal_counts',
      headerName: 'ANIMALS',
      renderCell: params => <Typography sx={{ px: 3, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'documents_count',
      headerName: 'DOCUMENTS',
      renderCell: params => <Typography sx={{ px: 3, width: '100%', pl: 3 }}>{params.value}</Typography>
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
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Documents</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Shipments</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title='Shipment Documents'
          slotProps={{
            title: {
              sx: { fontSize: '1.5rem !important', fontWeight: 'bold' }
            }
          }}
          action={
            <AddButtonContained
              title='Add New'
              action={() => router.push('/compliance/documents/shipments/AddEditShipment')}
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
              placeholder='Search'
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
                onClick={handleFilterDrawerOpen}
              >
                Filter
              </Button>
            </Box>
          </Box>

          <Grid size={{ xs: 12 }}>
            <CommonTable
              columns={columns}
              indexedRows={rows}
              total={total}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={newModel => setSortModel(newModel)}
              loading={loading}
              onRowClick={handleRowClick}
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
        contextId={'3'}
      />
    </>
  )
}

export default enforceModuleAccess(ShipmentPage, 'compliance_module')
