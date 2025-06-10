import { Card, CardHeader, Box, debounce, IconButton, Typography, useTheme, Grid } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import UserSnackbar from 'src/components/utility/snackbar'
import {
  getDocumentTypeList,
  addDocumentType,
  updateDocumentType,
  getTradeContextTypes
} from 'src/lib/api/compliance/settings/documentTypes'
import AddDocumentType from 'src/views/pages/compliance/documentTypes/AddDocumentType'
import EditDocumentType from 'src/views/pages/compliance/documentTypes/EditDocumentType'
import Toaster from 'src/components/Toaster'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'

const DocumentTypes = () => {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState({ id: null })

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [tradeContextTypes, setTradeContextTypes] = useState([])
  const [contextLoading, setContextLoading] = useState(false)

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
    setEditParams({
      id: row.id,
      name: row.name,
      description: row.description,
      contexts: (row.context_ids || []).map(Number),
      active: row.active
    })
    setOpenDrawer(true)
    if(!tradeContextTypes.length)
      await fetchTradeContextTypes()
  }

  const headerAction = <AddButton title='Add Document Type' action={addEventSidebarOpen} />

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          q,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,

          // status: "",
          // sort,
          // column,
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

  const columns = [
    {
      flex: 0.07,
      width: 40,
      field: 'uid',
      headerName: 'SL No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2  }}>
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
    },
    {
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
    }
  ]

  return (
    <>
      <Card>
        <CardHeader title='Document Type List' action={headerAction} sx={{ px: 5 }} />
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
            pageSizeOptions={[10]}
            loading={loading}
            searchValue={searchValue}
            disablePagination={false}
          />
        </Grid>
      </Card>

      {openDrawer && !editParams.id && (
        <AddDocumentType
          addOpen={openDrawer}
          handleClose={handleSidebarClose}
          handleSubmitData={handleSubmitData}
          submitLoader={submitLoader}
          tradeContextTypes={tradeContextTypes}
          contextLoading={contextLoading}
        />
      )}

      {openDrawer && editParams.id && (
        <EditDocumentType
          editOpen={openDrawer}
          handleClose={handleSidebarClose}
          handleSubmitData={handleSubmitData}
          submitLoader={submitLoader}
          editId={editParams.id}
          tradeContextTypes={tradeContextTypes}
          contextLoading={contextLoading}
          defaultValues={editParams}
        />
      )}

      <UserSnackbar status={openSnackbar} message={snackbarMessage} severity={severity} handleClose={handleClose} />
    </>
  )
}

export default DocumentTypes
