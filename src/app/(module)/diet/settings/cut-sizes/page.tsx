'use client';
import { Card, CardHeader, Box, debounce, Grid, Tooltip } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { AddButton } from 'src/components/Buttons'
import Icon from 'src/@core/components/icon'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserSnackbar from 'src/components/utility/snackbar'
import { getCutsizeList, addCutSize, UpdateCutsize } from 'src/lib/api/diet/settings/cutSizes'
import AddCutSize from 'src/views/pages/diet/cutSizes/addCutSizes'
import Toaster from 'src/components/Toaster'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import MUISearch from 'src/views/forms/form-fields/MUISearch'

const CutSizes = () => {
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
      flex: 0.14,
      Width: 40,
      field: 'uid',
      headerName: 'SL No',
      sortable: false,
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
      headerName: t('name'),
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
      headerName: t('comment'),
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
      headerName: t('status'),
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
      headerName: t('action'),
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
      <AddButton title={t('diet_module.add_cut_size')} action={() => addEventSidebarOpen()} />
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

  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      searchTableData(sort, value, sortColumn)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort, sortColumn, searchTableData, searchValue]
  )

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
        <Grid sx={{ mx: 5 }}>
          <Grid container sx={{ mt: 2, justifyContent: 'flex-end' }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MUISearch
                value={searchValue}
                onChange={e => handleSearch(e.target.value)}
                onClear={() => handleSearch('')}
                placeholder='Search…'
              />
            </Grid>
          </Grid>
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
            searchValue={searchValue}
            handleSearchOverride={handleSearch}
          />
        </Grid>
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
  )
}

export default CutSizes
