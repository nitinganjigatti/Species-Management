import { Card, CardHeader, Box, debounce } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import UserSnackbar from 'src/components/utility/snackbar'
import {
  UpdatePreparationType,
  addPreparationType,
  getPreparationTypeList
} from 'src/lib/api/diet/settings/preparationTypes'
import AddPreparationType from 'src/views/pages/diet/preparationTypes/addPreparationType'
import Toaster from 'src/components/Toaster'
import { useTheme } from '@mui/material/styles'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { useTranslation } from 'react-i18next'

const PreparationTypes = () => {
  const theme = useTheme()
  const { t } = useTranslation()
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
      flex: 0.07,
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
      flex: 0.2,
      minWidth: 20,
      field: 'label',
      headerName: t('name'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.label}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'active',
      headerName: t('status'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: t('action'),
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
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
      <AddButton title={t('diet_module.add_preparation_type')} action={() => addEventSidebarOpen()} />
    </div>
  )

  const fetchTableData = useCallback(
    async (sort, q, column) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getPreparationTypeList(params).then(res => {
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
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
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
        response = await UpdatePreparationType(editParams?.id, payload)
      } else {
        response = await addPreparationType(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: 'Preparation type' + ' ' + response?.message })
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
        <CardHeader title={t('diet_module.preparation_type_list')} action={headerAction} sx={{ px: 5 }} />
        <CommonTable
          indexedRows={indexedRows === undefined ? [] : indexedRows}
          total={total}
          columns={columns}
          paginationModel={paginationModel}
          handleSortModel={handleSortModel}
          setPaginationModel={setPaginationModel}
          loading={loading}
          columnVisibilityModel={{
            id: false
          }}
          slots={{ toolbar: ServerSideToolbarWithFilter }}
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
          externalTableStyle={{
            '.MuiDataGrid-main': {
              marginLeft: '20px',
              marginRight: '20px'
            }
          }}
        />
      </Card>
      <AddPreparationType
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
  )
}

export default PreparationTypes
