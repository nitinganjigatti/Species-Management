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
  Tabs
} from '@mui/material'
import React, { useCallback, useEffect, useState, useContext } from 'react'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import UserSnackbar from 'src/components/utility/snackbar'
import {
  getDocumentTypeList,
  addDocumentType,
  updateDocumentType,
  getTradeContextTypes
} from 'src/lib/api/compliance/masters'
import Toaster from 'src/components/Toaster'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import { AuthContext } from 'src/context/AuthContext'
import AddEditDocumentType from 'src/views/pages/compliance/documents/masters/AddEditDocumentType'

const tabConfig = [
  { label: 'Export', value: 'exports', context_id: 1 },
  { label: 'Import', value: 'imports', context_id: 2 },
  { label: 'Shippment', value: 'shippment', context_id: 3 }
]

const DocumentTypes = () => {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState({ id: null })

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')
  const [tradeContextTabs, setTradeContextTabs] = useState([])

  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('asc')
  const [sortColumn, setSortColumn] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('exports')

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
        const tabList = res.data.map(item => ({
          label: item.label,
          value: item.context_key, // assuming this is the unique identifier for tab selection
          context_id: item.id
        }))
        setTradeContextTabs(tabList)
        setTradeContextTypes(res.data || [])
        const defaultTab = tabList.find(tab => tab.context_id === 1)
        if (defaultTab) {
          setSelectedTab(defaultTab.value)
        }
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
    setEditParams({
      id: row.id,
      name: row.name,
      description: row.description,
      contexts: (row.context_ids || []).map(Number),
      active: row.active
    })
    setOpenDrawer(true)
    if (!tradeContextTypes.length) await fetchTradeContextTypes()
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
      flex: 0.4,
      minWidth: 20,
      field: 'name',
      headerName: 'Name',
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
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right', px: 2 }}>
        {parseInt(params.row.zoo_id) === 0 ? null : (
          <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row)} aria-label='Edit'>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        )}
      </Box>
    )
  })

  const columns = baseColumns

  // Conditionally show Add button based on access permissions
  const headerAction = <AddButton title='Add Document Type' action={addEventSidebarOpen} />

  // const headerAction =
  //   hasAddAccess || hasEditAccess || hasFullAccess ? <AddButton title='Add Document Type' action={addEventSidebarOpen} /> : null

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        // Get context_id based on selected tab
        // Use dynamically set tab config
        const contextId = tradeContextTabs.find(tab => tab.value === selectedTab)?.context_id

        const params = {
          q,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          context_id: contextId
        }

        const res = await getDocumentTypeList(params)
        const startingIndex = paginationModel.page * paginationModel.pageSize

        const listWithId = res.data.records.map((el, i) => ({
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
    [paginationModel, selectedTab, tradeContextTabs] // selectedTab must be a dependency!
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  useEffect(() => {
    fetchTradeContextTypes()
  }, [])

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

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleSubmitData = async (payload, editId = null) => {
    try {
      setSubmitLoader(true)

      // Filter out empty/null/undefined fields
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([_, value]) =>
            value !== null &&
            value !== undefined &&
            (typeof value !== 'string' || value.trim() !== '') &&
            (!Array.isArray(value) || value.length > 0)
        )
      )

      const response = editId ? await updateDocumentType(editId, cleanedPayload) : await addDocumentType(cleanedPayload)

      if (response?.success) {
        Toaster({ type: 'success', message: 'Document type ' + response?.message })
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
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Documents</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Masters</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title={<Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>Document Types</Typography>}
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
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              {tradeContextTabs.map(tab => (
                <Tab key={tab.context_id} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Box>

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
        <AddEditDocumentType
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

      <UserSnackbar status={openSnackbar} message={snackbarMessage} severity={severity} handleClose={handleClose} />
    </>
  )
}

export default DocumentTypes
