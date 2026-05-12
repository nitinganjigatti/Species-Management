'use client'

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
import { useTranslation } from 'react-i18next'
import { GridColDef, GridSortModel } from '@mui/x-data-grid'
import { TradeContextType } from 'src/types/compliance'

interface EditParams {
  id: string | null
  name?: string
  contexts?: string[]
}

const Imports = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [deletePop, setDeletePop] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [editParams, setEditParams] = useState<EditParams>({ id: null })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string>('')
  const [severity, setSeverity] = useState<string>('success')

  const [total, setTotal] = useState<number>(0)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [sort, setSort] = useState<string>('desc')
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState<boolean>(false)

  const [tradeContextTypes, setTradeContextTypes] = useState<TradeContextType[]>([])
  const [contextLoading, setContextLoading] = useState<boolean>(false)

  const complianceModuleAccessContext = useContext(AuthContext)
  const complianceModuleAccess =
    (complianceModuleAccessContext?.userData as any)?.roles?.settings?.compliance_module || ''

  const hasAddAccess =
    complianceModuleAccess === 'ADD' || complianceModuleAccess === 'EDIT' || complianceModuleAccess === 'DELETE'
  const hasEditAccess = complianceModuleAccess === 'EDIT' || complianceModuleAccess === 'DELETE'
  const hasFullAccess = complianceModuleAccess === 'allow_full_access'

  console.log('complianceModuleAccess', complianceModuleAccess)

  const handleClose = (_: unknown, reason?: string) => {
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

  const handleEdit = async (row: Record<string, unknown>) => {
    // Collect context types based on boolean flags
    const contexts: string[] = []
    if (row.importer === '1') contexts.push('importer')
    if (row.exporter === '1') contexts.push('exporter')

    setEditParams({
      id: row.id as string,
      name: row.name as string,
      contexts: contexts
    })

    setOpenDrawer(true)
  }

  const handledelete = (row: Record<string, unknown>) => {
    setDeletePop(true)
    setDeleteId(row.id as string)
  }

  const confirmDeletion = async () => {
    try {
      const response = await deleteTradeParties(deleteId as string)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setDeletePop(false)
        await fetchTableData(sort, searchValue, sortColumn)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
      }
    } catch (error) {
      Toaster({ type: 'error', message: t('compliance_module.failed_to_delete_trade_party_please_try_again') })
      console.error('Deletion error:', error)
    } finally {
      setSubmitLoader(false)
      setOpenDrawer(false)
    }
  }

  const baseColumns: GridColDef[] = [
    {
      flex: 0.07,
      width: 40,
      field: 'uid',
      headerName: t('compliance_module.sl_no'),
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
      headerName: t('name'),
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
      headerName: t('status'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
          {params.row.active === '1' ? t('active') : t('inactive')}
        </Typography>
      )
    }
  ]

  // Conditionally add Action column based on access permissions
  baseColumns.push({
    flex: 0.2,
    minWidth: 20,
    field: 'action',
    headerName: t('action'),
    sortable: false,
    renderCell: params => (
      <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right', px: 2 }}>
        {parseInt(params.row.zoo_id as string) === 0 ? null : (
          <>
            <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row)} aria-label='Edit'>
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
            <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handledelete(params.row)} aria-label='Delete'>
              <Icon icon='mdi:delete-outline' />
            </IconButton>
          </>
        )}
      </Box>
    )
  })

  const columns = baseColumns

  // Conditionally show Add button based on access permissions
  const headerAction = <AddButton title={t('add_new')} action={addEventSidebarOpen} disabled={false} styles={{}} />

  const fetchTableData = useCallback(
    async (sort: string, q: string, column: string) => {
      try {
        setLoading(true)

        const params = {
          type: 'importer',
          sort,
          column,
          q,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }
        const res = await getMasterImports(params)
        const startingIndex = paginationModel.page * paginationModel.pageSize

        const listWithId = ((res.data?.data || []) as Record<string, unknown>[]).map(
          (el: Record<string, unknown>, i: number) => ({
            ...el,
            uid: startingIndex + i + 1
          })
        )
        setTotal(parseInt(String(res?.data?.total || 0)))
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

  const handleSearch = (value: string) => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleSubmitData = async (payload: Record<string, unknown>, editId: string | null = null) => {
    try {
      setSubmitLoader(true)

      // Construct params with comma-separated 'type'
      const params = {
        name: payload.name as string,
        type: ((payload.contexts as string[]) || []).join(', ')
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
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>{t('compliance_module.compliance')}</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>{t('compliance_module.masters')}</Typography>
        <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>{t('compliance_module.importer')}</Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader
          title={
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>{t('compliance_module.importer')}</Typography>
          }
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
          name='Importer'
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

      <Dialog open={deletePop} onClose={() => setDeletePop(false)}>
        <DialogTitle>{t('compliance_module.confirm_deletion')}</DialogTitle>
        <DialogContent>{t('compliance_module.are_you_sure_you_want_to_remove_trade_party')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePop(false)} color='primary'>
            {t('cancel')}
          </Button>
          <Button onClick={confirmDeletion} color='error' variant='contained'>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* <UserSnackbar status={openSnackbar} message={snackbarMessage} severity={severity} handleClose={handleClose} /> */}
    </>
  )
}

export default Imports
