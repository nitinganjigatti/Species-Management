import {
  Card,
  CardHeader,
  Box,
  debounce,
  IconButton,
  Typography,
  useTheme,
  Grid,
  Breadcrumbs,
  Tab,
  Tabs,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material'
import React, { useCallback, useEffect, useState, useContext } from 'react'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import UserSnackbar from 'src/components/utility/snackbar'
import {
  getDocumentTypeList,
  addDocumentType,
  updateDocumentType,
  getTradeContextTypes,
  getMasterImports,
  createTradeParties,
  updateTradeParties,
  deleteTradeParties
} from 'src/lib/api/compliance/masters'
import Toaster from 'src/components/Toaster'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import { AuthContext } from 'src/context/AuthContext'
import AddEditDocumentType from 'src/views/pages/compliance/documents/masters/AddEditDocumentType'
import AddImportSlider from 'src/views/pages/compliance/documents/masters/AddImportSlider'

const tabConfig = [
  { label: 'Export', value: 'exports', component: '' },
  { label: 'Import', value: 'imports', component: '' },
  { label: 'Shippment', value: 'shippment', component: '' }
]

const Exports = () => {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [deletePop, setDeletePop] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState({ id: null })
  const [deleteId, setDeleteId] = useState(null)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')

  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [tradeContextTypes, setTradeContextTypes] = useState([])
  const [contextLoading, setContextLoading] = useState(false)

  const complianceModuleAccessContext = useContext(AuthContext)
  const complianceModuleAccess = complianceModuleAccessContext?.userData?.roles?.settings?.compliance_module || ''

  const hasAddAccess =
    complianceModuleAccess === 'ADD' || complianceModuleAccess === 'EDIT' || complianceModuleAccess === 'DELETE'
  const hasEditAccess = complianceModuleAccess === 'EDIT' || complianceModuleAccess === 'DELETE'
  const hasFullAccess = complianceModuleAccess === 'allow_full_access'

  console.log('complianceModuleAccess', complianceModuleAccess)

  const handleClose = (_, reason) => {
    if (reason !== 'clickaway') setOpenSnackbar(false)
  }

  const fetchTradeContextTypes = async () => {
    setContextLoading(true)
    try {
      const res = await getTradeContextTypes()
      if (res?.success) {
        setTradeContextTypes(res.data || [])
      }
    } catch (e) {
      console.error(e)
    }
    setContextLoading(false)
  }

  const addEventSidebarOpen = async () => {
    setEditParams({ id: null })
    setOpenDrawer(true)
    await fetchTradeContextTypes()
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleEdit = async row => {
    console.log('Details >', row)

    // Collect context types based on boolean flags
    const contexts = []
    if (row.importer === '1') contexts.push('importer')
    if (row.exporter === '1') contexts.push('exporter')

    setEditParams({
      id: row.id,
      name: row.name,
      contexts: contexts // This will be ['importer'], ['exporter'], or ['importer', 'exporter']
    })

    setOpenDrawer(true)
  }

  const handledelete = row => {
    setDeletePop(true)
    setDeleteId(row.id)
  }

  const confirmDeletion = async () => {
    try {
      const response = await deleteTradeParties(deleteId)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setDeletePop(false)
        await fetchTableData(sort, searchValue, sortColumn)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: 'Failed to delete trade party. Please try again.' })
      console.error('Deletion error:', error)
    } finally {
      setSubmitLoader(false)
      setOpenDrawer(false)
    }
  }

  const baseColumns = [
    {
      flex: 0.07,
      width: 40,
      field: 'uid',
      headerName: 'SL No',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
          {parseInt(params.row.uid)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'name',
      headerName: 'Name',
      sortable: false,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: 'text.primary',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            px: 2
          }}
        >
          {params.row.name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'active',
      headerName: 'Status',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    }
  ]

  // Conditionally add Action column based on access permissions
  // if (hasAddAccess || hasEditAccess || hasFullAccess) {
  baseColumns.push({
    flex: 0.2,
    minWidth: 20,
    headerName: 'Action',
    sortable: false,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right', px: 2 }}>
        {parseInt(params.row.zoo_id) === 0 ? null : (
          <>
            <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row)} aria-label='Edit'>
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
            <Avatar
              sx={{ width: '40%', height: '40%', borderRadius: '8px', cursor: 'pointer', mt: 1 }}
              src={'/icons/delete_outlined.svg'}
              variant='square'
              onClick={() => handledelete(params.row)}
            />
          </>
        )}
      </Box>
    )
  })

  const columns = baseColumns

  // Conditionally show Add button based on access permissions
  const headerAction = <AddButton title='Add  New' action={addEventSidebarOpen} />

  // const headerAction =
  //   hasAddAccess || hasEditAccess || hasFullAccess ? <AddButton title='Add Document Type' action={addEventSidebarOpen} /> : null

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          type: 'exporter',
          sort,
          column,
          q,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }
        const res = await getMasterImports(params)
        const startingIndex = paginationModel.page * paginationModel.pageSize

        const listWithId = res.data.data.map((el, i) => ({
          ...el,
          uid: startingIndex + i + 1
        }))
        setTotal(parseInt(res?.data?.total))
        setRows(listWithId)
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      await fetchTableData(sort, q, column)
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleSubmitData = async (payload, editId = null) => {
    try {
      debugger
      setSubmitLoader(true)

      // Filter out empty/null/undefined fields
      const params = {
        name: payload.name,
        type: (payload.contexts || []).join(', ')
      }

      const response = editId ? await updateTradeParties(editId, params) : await createTradeParties(params)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setSubmitLoader(false)
        setOpenDrawer(false)
        await fetchTableData(sort, searchValue, sortColumn)
      } else {
        setSubmitLoader(false)
        setOpenDrawer(false)
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenDrawer(false)
      Toaster({ type: 'error', message: JSON.stringify(e) })
    }
  }

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Compliance</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>masters</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Exporter</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title='Exporter'
          titleTypographyProps={{ fontSize: '1.5rem !important', fontWeight: 'bold' }}
          action={headerAction}
          sx={{ px: 5, display: 'flex', flexWrap: 'wrap', gap: 2 }}
        />

        <Grid sx={{ mx: 5 }}>
          <Search
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder='Search…'
            sx={{ mt: 2, justifyContent: 'flex-end' }}
          />

          <CommonTable
            indexedRows={rows}
            total={total}
            columns={columns}
            paginationModel={paginationModel}
            handleSortModel={handleSortModel}
            setPaginationModel={setPaginationModel}
            pageSizeOptions={[7, 10, 25, 50, 100]}
            loading={loading}
            searchValue={searchValue}
          />
        </Grid>
      </Card>

      {openDrawer && (
        <AddImportSlider
          name='Exporter'
          open={openDrawer}
          handleClose={handleSidebarClose}
          handleSubmitData={handleSubmitData}
          submitLoader={submitLoader}
          tradeContextTypes={tradeContextTypes}
          contextLoading={contextLoading}
          editId={editParams?.id || null}
          initialValues={editParams?.id ? editParams : null}
        />
      )}

      <Dialog open={deletePop} onClose={() => setDeletePop(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>Are you sure you want to remove trade party?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePop(false)} color='primary'>
            Cancel
          </Button>
          <Button onClick={confirmDeletion} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* <UserSnackbar status={openSnackbar} message={snackbarMessage} severity={severity} handleClose={handleClose} /> */}
    </>
  )
}

export default Exports
