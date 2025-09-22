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
import { getImportsList } from 'src/lib/api/compliance/imports'
import moment from 'moment'
import RenderUtility from 'src/utility/render'
import Utility from 'src/utility'
import { useTheme } from '@mui/material/styles'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import FiltersDrawer from 'src/components/compliance/drawer/FiltersDrawer'
import { ExportButton } from 'src/views/utility/render-snippets'
import { format, subMonths } from 'date-fns'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const ImportsPage = () => {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [selectedId, setSelectedId] = useState(null)
  const [sortModel, setSortModel] = useState([])
  const [exportLoading, setExportLoading] = useState(false)

  // const [filterDate, setFilterDate] = useState({
  //   startDate: Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
  //   endDate: Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  // })
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
        q: searchValue,
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
      const res = await getImportsList(params)
      const start = paginationModel.page * paginationModel.pageSize
      setRows(
        res.data.records.map((r, i) => ({
          ...r,
          uid: start + i + 1,
          import_number: r.import_number || '-',
          import_date: r.import_date ? r.import_date : '-',
          exports_count: r.exports_count || '-',
          species_count: r.species_count || '-',
          animals_count: r.animals_count || '-',
          documents_count: r.documents_count || '-'
        }))
      )
      setTotal(res.data.count)
    } catch (error) {
      Toaster({ type: 'error', message: 'Failed to fetch export permits' })
    }
    setLoading(false)
  }, [searchValue, paginationModel, sortModel, filterDate, selectedOptions])

  const handleExport = async () => {
    setExportLoading(true)
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
        missing_docs: prepareFilterParams('Documents'),
        response_type: 'csv'
      }
      const res = await getImportsList(params)

      const fileUrl = res?.data
      if (fileUrl) {
        Utility.downloadFileFromURL(fileUrl, `Imports Report`)
        Toaster({ type: 'success', message: res?.message || 'Report downloaded successfully!' })
      } else {
        Toaster({ type: 'error', message: 'File URL not found in response' })
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      Toaster({ type: 'error', message: 'Failed to download the report' })
    } finally {
      setExportLoading(false)
    }
  }

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

    Router.push(`/compliance/documents/imports/AddEditImport/?id=${params.row.id}&action=details`)
  }

  const columns = [
    {
      flex: 0.01,
      minWidth: 100,
      field: 'uid',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography sx={{ px: 2, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </Typography>
      )
    },
    {
      flex: 0.12,
      minWidth: 300,
      field: 'import_number',
      headerName: 'Import ID',
      renderCell: params => {
        return (
          <Typography
            sx={{
              cursor: 'pointer',
              px: 3,
              width: '100%'
            }}
          >
            {params.value || ''}
          </Typography>
        )
      }
    },
    {
      flex: 0.15,
      minWidth: 150,
      field: 'import_date',
      headerName: 'Issued',
      renderCell: params => (
        <Typography sx={{ px: 0, width: '100%' }}>
          {moment(params?.value, 'YYYY-MM-DD', true).isValid() ? moment(params?.value).format('DD MMM YYYY') : '-'}
        </Typography>
      )
    },
    {
      flex: 0.08,
      minWidth: 100,
      field: 'exports_count',
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
      field: 'animals_count',
      headerName: 'ANIMALS',
      renderCell: params => <Typography sx={{ px: 3, width: '100%' }}>{params.value}</Typography>
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'documents_count',
      headerName: 'DOCUMENTS',
      renderCell: params => <Typography sx={{ width: '100%', pl: 4 }}>{params.value}</Typography>
    },
    {
      flex: 0.3,
      minWidth: 180,
      field: 'created_by_user_name',
      headerName: 'Created By',
      renderCell: params => (
        <Box sx={{ px: 2 }}>
          {params.row.created_by_user_name ? (
            <UserAvatarDetails
              profile_image={params?.row?.created_user_profile_pic}
              user_name={params?.row?.created_by_user_name}
              date={params?.row?.created_at}
            />
          ) : null}
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
          {params.row.updated_by_user_name ? (
            <UserAvatarDetails
              profile_image={params?.row?.updated_user_profile_pic}
              user_name={params?.row?.updated_by_user_name}
              date={params?.row?.updated_at}
            />
          ) : (
            '-'
          )}
        </Box>
      )
    }
  ]

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Documents</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Imports</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title={<Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>Import Documents</Typography>}
          action={
            <AddButtonContained
              title='Add New'
              action={() => router.push('/compliance/documents/imports/AddEditImport')}
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
              <ExportButton loading={exportLoading} tooltip='Download Report' onClick={handleExport} />
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
        contextId={'2'}
      />
    </>
  )
}

export default enforceModuleAccess(ImportsPage, 'compliance_module')
