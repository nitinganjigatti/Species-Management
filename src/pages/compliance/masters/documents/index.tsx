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
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { GridColDef, GridSortModel } from '@mui/x-data-grid'
import { TradeContextType } from 'src/types/compliance'

interface TabConfig {
  label: string | undefined
  value: any
  context_id: any
}

interface EditParams {
  id: string | null
  name?: string
  description?: string
  contexts?: number[]
  active?: string
}

const DocumentTypes = () => {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [editParams, setEditParams] = useState<EditParams>({ id: null })

  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string>('')
  const [severity, setSeverity] = useState<string>('success')
  const [tradeContextTabs, setTradeContextTabs] = useState<TabConfig[]>([])

  const [total, setTotal] = useState<number>(0)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [sort, setSort] = useState<string>('asc')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedTab, setSelectedTab] = useState<string>('exports')

  const [tradeContextTypes, setTradeContextTypes] = useState<TradeContextType[]>([])
  const [contextLoading, setContextLoading] = useState<boolean>(false)

  const complianceModuleAccessContext = useContext(AuthContext)
  const complianceModuleAccess = (complianceModuleAccessContext?.userData as any)?.roles?.settings?.compliance_module || ''

  const hasAddAccess =
    complianceModuleAccess === 'ADD' || complianceModuleAccess === 'EDIT' || complianceModuleAccess === 'DELETE'
  const hasEditAccess = complianceModuleAccess === 'EDIT' || complianceModuleAccess === 'DELETE'
  const hasFullAccess = complianceModuleAccess === 'allow_full_access'

  const handleClose = (_: unknown, reason?: string) => {
    if (reason !== 'clickaway') setOpenSnackbar(false)
  }

  const fetchTradeContextTypes = async () => {
    setContextLoading(true)
    try {
      const res = await getTradeContextTypes()
      if (res?.success) {
        const tabList: TabConfig[] = (res.data || []).map((item: TradeContextType) => ({
          label: item.label,
          value: (item as any).context_key,
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

  const handleEdit = async (row: Record<string, unknown>) => {
    setEditParams({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      contexts: ((row.context_ids as string[]) || []).map(Number),
      active: row.active as string
    })
    setOpenDrawer(true)
    if (!tradeContextTypes.length) await fetchTradeContextTypes()
  }

  const baseColumns: GridColDef[] = [
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
  baseColumns.push({
    flex: 0.2,
    minWidth: 20,
    field: 'action',
    headerName: 'Action',
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right', px: 2 }}>
        {parseInt(params.row.zoo_id as string) === 0 ? null : (
          <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row)} aria-label='Edit'>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        )}
      </Box>
    )
  })

  const columns = baseColumns

  // Conditionally show Add button based on access permissions
  const headerAction = <AddButton title='Add Document Type' action={addEventSidebarOpen} disabled={false} styles={{}} />

  const fetchTableData = useCallback(
    async (sort: string, q: string, column: string) => {
      try {
        setLoading(true)

        // Get context_id based on selected tab
        const contextId = tradeContextTabs.find(tab => tab.value === selectedTab)?.context_id

        const params = {
          q,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          context_id: contextId
        }

        const res = await getDocumentTypeList(params)
        const startingIndex = paginationModel.page * paginationModel.pageSize

        const listWithId = ((res.data?.records || []) as Record<string, unknown>[]).map((el: Record<string, unknown>, i: number) => ({
          ...el,
          uid: startingIndex + i + 1
        }))
        setTotal(parseInt(String(res?.data?.total || 0)))
        setRows(listWithId)
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel, selectedTab, tradeContextTabs]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  useEffect(() => {
    fetchTradeContextTypes()
  }, [])

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSort(newModel[0].sort as string)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort as string, searchValue, newModel[0].field)
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort: string, q: string, column: string) => {
      setSearchValue(q)
      await fetchTableData(sort, q, column)
    }, 1000),
    []
  )

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleSubmitData = async (payload: Record<string, unknown>, editId: string | null = null) => {
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
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
          handleSubmitData={handleSubmitData as any}
          submitLoader={submitLoader}
          tradeContextTypes={tradeContextTypes}
          contextLoading={contextLoading}
          editId={editParams?.id || null}
          initialValues={editParams?.id ? (editParams as any) : null}
        />
      )}

      <UserSnackbar status={openSnackbar} message={snackbarMessage} severity={severity} handleClose={handleClose} />
    </>
  )
}

export default enforceModuleAccess(DocumentTypes, 'compliance_module')
