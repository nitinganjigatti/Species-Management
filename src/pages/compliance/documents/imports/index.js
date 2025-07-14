import React, { useState, useEffect, useCallback, useContext } from 'react'
import { Card, CardHeader, Grid, Box, Breadcrumbs, Typography } from '@mui/material'
import { AddButton } from 'src/components/Buttons'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { debounce } from 'lodash'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import { useForm } from 'react-hook-form'
import { AddButtonContained } from 'src/components/ButtonContained'

// Mock APIs
const getImportCountries = async () => ({
  success: true,
  data: [
    { label: 'Country A', value: 'A' },
    { label: 'Country B', value: 'B' }
  ]
})

const getSpecies = async () => ({
  success: true,
  data: [
    { label: 'Species X', value: 'X' },
    { label: 'Species Y', value: 'Y' }
  ]
})

const getImportList = async params => ({
  success: true,
  data: {
    total: 3,
    records: [
      { id: 1, title: 'Import Alpha', uploaded_at: '2025-06-02', tags: [{ label: 'A', value: 'A' }] },
      { id: 2, title: 'Import Beta', uploaded_at: '2025-06-04', tags: [{ label: 'B', value: 'B' }] },
      { id: 3, title: 'Import Gamma', uploaded_at: '2025-06-06', tags: [{ label: 'X', value: 'X' }] }
    ]
  }
})

const addImport = async (id, data) => ({ success: true, message: 'Import added' })
const updateImport = async (id, data) => ({ success: true, message: 'Import updated' })

const ImportsPage = () => {
  const { userData } = useContext(AuthContext)
  const canEdit = userData?.roles?.settings?.import_module === 'EDIT'

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sortModel, setSortModel] = useState([])
  const [filterDate, setFilterDate] = useState({})
  const [countryOptions, setCountryOptions] = useState([])
  const [speciesOptions, setSpeciesOptions] = useState([])
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editImport, setEditImport] = useState(null)

  const { control, watch } = useForm({
    defaultValues: {
      importingCountry: null,
      species: null
    }
  })
  const selectedTag = watch('importingCountry')

  const fetchCountries = async () => {
    const res = await getImportCountries()
    if (res.success) setCountryOptions(res.data)
  }

  const fetchSpecies = async () => {
    const res = await getSpecies()
    if (res.success) setSpeciesOptions(res.data)
  }

  const fetchImports = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        q: searchValue,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        sort: sortModel[0]?.sort,
        sortBy: sortModel[0]?.field,
        from_date: filterDate.startDate,
        to_date: filterDate.endDate,
        tag: selectedTag?.value
      }
      const res = await getImportList(params)
      const start = paginationModel.page * paginationModel.pageSize
      setRows(res.data.records.map((r, i) => ({ ...r, uid: start + i + 1 })))
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [searchValue, paginationModel, sortModel, filterDate, selectedTag])

  useEffect(() => {
    fetchCountries()
    fetchSpecies()
  }, [])

  useEffect(() => {
    fetchImports()
  }, [fetchImports])

  const debouncedSearch = useCallback(
    debounce(val => {
      setSearchValue(val)
    }, 500),
    []
  )

  const handleSearch = val => debouncedSearch(val)

  const columns = [
    { field: 'uid', headerName: 'SL No', sortable: false, flex: 0.07 },
    { field: 'title', headerName: 'Title', flex: 0.3 },
    { field: 'uploaded_at', headerName: 'Uploaded At', flex: 0.2 },
    {
      field: 'tags',
      headerName: 'Tags',
      flex: 0.3,
      renderCell: params => <Box>{(params.row.tags || []).map(t => t.label).join(', ')}</Box>
    },
    {
      field: 'action',
      headerName: 'Action',
      sortable: false,
      flex: 0.15,
      renderCell: params =>
        canEdit && (
          <AddButton
            title='Edit'
            action={() => {
              setEditImport(params.row)
              setOpenDrawer(true)
            }}
            small
          />
        )
    }
  ]

  const handleSubmit = async (data, editId) => {
    const apiFn = editId ? updateImport : addImport

    try {
      const res = await apiFn(editId, data)
      Toaster({ type: res.success ? 'success' : 'error', message: res.message || 'Something went wrong' })

      if (res.success) {
        setOpenDrawer(false)
        fetchImports()
      }
    } catch (error) {
      console.error('Import submit error:', error)
      Toaster({ type: 'error', message: error?.message || 'An unexpected error occurred' })
    }
  }

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Documents</Typography>

        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Import</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title={<Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>Import Documents</Typography>}
          action={
            <AddButtonContained
              title='ADD NEW'
              action={() => {
                setEditImport(null)
                setOpenDrawer(true)
              }}
            />
          }
          sx={{ px: 5 }}
        />
        <Grid container spacing={4} sx={{ px: 5, py: 2 }} alignItems='center'>
          <Grid item xs={12} md={3}>
            <Search
              placeholder='Search imports...'
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
            />
          </Grid>
          <Grid item xs={12} md={0.5} />
          <Grid item xs={12} md={4.5}>
            <CommonDateRangePickers
              filterDates={filterDate}
              onChange={(s, e) => setFilterDate({ startDate: s, endDate: e })}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <ControlledAutocomplete
              name='importingCountry'
              label='Importing Country'
              control={control}
              errors={{}}
              options={countryOptions}
              getOptionLabel={o => o.label}
              isOptionEqualToValue={(o, v) => o.value === v.value}
              textFieldProps={{
                size: 'small',
                InputProps: { sx: { fontSize: '0.875rem', height: 40 } },
                InputLabelProps: { sx: { fontSize: '0.875rem' } }
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <ControlledAutocomplete
              name='species'
              label='Species'
              control={control}
              errors={{}}
              options={speciesOptions}
              getOptionLabel={o => o.label}
              isOptionEqualToValue={(o, v) => o.value === v.value}
              textFieldProps={{
                size: 'small',
                InputProps: { sx: { fontSize: '0.875rem', height: 40 } },
                InputLabelProps: { sx: { fontSize: '0.875rem' } }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <CommonTable
              columns={columns}
              indexedRows={rows}
              total={total}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              handleSortModel={mod => setSortModel(mod)}
              loading={loading}
            />
          </Grid>
        </Grid>
      </Card>
      {/* Add your AddImportDrawer component here */}
      {/* {openDrawer && (
        <AddImportDrawer
          open={openDrawer}
          initialData={editImport}
          onClose={() => setOpenDrawer(false)}
          onSubmit={handleSubmit}
        />
      )} */}
    </>
  )
}

export default ImportsPage
