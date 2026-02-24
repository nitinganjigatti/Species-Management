import { Card, CardHeader, Box, debounce, Hidden, Tooltip } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import UserSnackbar from 'src/components/utility/snackbar'
import { getCutsizeList, addCutSize, UpdateCutsize } from 'src/lib/api/diet/settings/cutSizes'
import AddPreparationType from 'src/views/pages/diet/preparationTypes/addPreparationType'
import AddCutSize from 'src/views/pages/diet/cutSizes/addCutSizes'
import Toaster from 'src/components/Toaster'
import { useTheme } from '@mui/material/styles'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'

const CutSizes = () => {
  const theme = useTheme()
  const editParamsInitialState = { id: null, label: null, status: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)
  function loadServerRows(currentPage, data) {
    return data
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    setOpenSnackbar(false)
  }

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, status: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleEdit = async (id, label, status) => {
    setEditParams({ id, label, status })
    setOpenDrawer(true)
  }

  const columns = [
    {
      flex: 0.14,
      Width: 40,
      field: 'uid',
      headerName: 'SL No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 4 }}>
          {parseInt(params.row.uid)}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'label',
      headerName: 'NAME',
      renderCell: params => (
        <Tooltip title={params.row.cut_size?.length > 30 ? params.row.cut_size : ''}>
          <Typography variant='body2' sx={{ color: 'text.primary', pl: 1 }} className='text_overflow_moduled'>
            {params.row.cut_size}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.5,
      minWidth: 20,
      field: 'comment',
      headerName: 'COMMENT',
      renderCell: params => (
        <Tooltip title={params.row.comment?.length > 40 ? params.row.comment : ''}>
          <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }} className='text_overflow_moduled'>
            {params.row.comment}
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'active',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right', pl: 2 }}>
          {parseInt(params.row.zoo_id) === 0 ? null : (
            <IconButton
              size='small'
              sx={{ mr: 0.5 }}
              onClick={() => handleEdit(params.row.id, params.row.label, params.row.status)}
              aria-label='Edit'
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          )}
        </Box>
      )
    }
  ]

  const headerAction = (
    <div>
      <AddButton title='Add Cut Size' action={() => addEventSidebarOpen()} />
    </div>
  )

  const fetchTableData = useCallback(
    async (sortBy, q, column) => {
      try {
        setLoading(true)

        const params = {
          sortBy,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getCutsizeList(params).then(res => {
          const startingIndex = paginationModel.page * paginationModel.pageSize

          let listWithId = res.data.result.map((el, i) => {
            return { ...el, uid: startingIndex + i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
        })
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
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sortBy, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sortBy, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await UpdateCutsize(editParams?.id, payload)
      } else {
        response = await addCutSize(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setSubmitLoader(false)
        setResetForm(true)
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

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      <Card>
        <CardHeader title='Cut Sizes' action={headerAction} sx={{ px: 5 }} />
        {/* <DataGrid
          columnVisibilityModel={{
            id: false
          }}
          autoHeight
          pagination
          hideFooterSelectedRowCount
          disableColumnSelector={true}
          rows={indexedRows === undefined ? [] : indexedRows}
          rowCount={total}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          onSortModelChange={handleSortModel}
          slots={{ toolbar: ServerSideToolbar }}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          slotProps={{
            baseButton: {
              variant: 'outlined'
            },
            toolbar: {
              value: searchValue,
              clearSearch: () => handleSearch(''),
              onChange: event => handleSearch(event.target.value)
            }
          }}
        /> */}
        <DataGrid
          columnVisibilityModel={{
            id: false
          }}
          sx={{
            '.MuiDataGrid-cell:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: theme.palette.customColors.customTableHeaderBg,
              color: theme.palette.customColors.customHeadingTextColor
            },
            '.MuiDataGrid-virtualScroller': {
              overflowX: 'auto'
            },
            '.MuiDataGrid-main': {
              borderLeft: '1px solid #0000000D',
              borderRight: '1px solid #0000000D',
              marginLeft: '20px',
              marginRight: '20px',
              borderRadius: '8px',
              border: '1px solid rgba(233, 233, 236, 1)'
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none'
            },

            '& .MuiDataGrid-row:last-of-type .MuiDataGrid-cell': {
              borderBottom: 'none'
            }
          }}
          hideFooterSelectedRowCount
          disableColumnSelector={true}
          autoHeight
          pagination
          rows={indexedRows === undefined ? [] : indexedRows}
          rowCount={total}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          onSortModelChange={handleSortModel}
          slots={{ toolbar: ServerSideToolbarWithFilter }}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          slotProps={{
            baseButton: {
              variant: 'outlined'
            },
            toolbar: {
              value: searchValue,
              clearSearch: () => handleSearch(''),
              onChange: event => handleSearch(event.target.value)
            }
          }}
          onCellClick={''}
          showToolbar />
      </Card>
      <AddCutSize
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
      />
      <UserSnackbar status={openSnackbar} message={snackbarMessage} severity={severity} handleClose={handleClose} />
    </>
  );
}

export default CutSizes
