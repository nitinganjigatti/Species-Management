import React, { useState, useEffect, useCallback } from 'react'

import { getGstList } from 'src/lib/api/pharmacy/getGstList'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Drawer } from '@mui/material'

import { debounce } from 'lodash'

import Router from 'next/router'

import AddGstSlabs from 'src/views/pages/pharmacy/medicine/gst/addGstSlab'
import { addTax, updateTax } from 'src/lib/api/pharmacy/getGstList'
import UserSnackbar from 'src/components/utility/snackbar'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import Utility from 'src/utility'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import { AddButton } from 'src/components/Buttons'

const ListOfGst = () => {
  const [gstList, setGstList] = useState([])
  const [loader, setLoader] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')
  const editParamsInitialState = { id: null, name: null, tax_value: null, active: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const { selectedPharmacy } = usePharmacyContext()

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }

    setOpenSnackbar(false)
  }

  const setAlertDefaults = ({ message, severity, status }) => {
    setOpenSnackbar(status)
    setSnackbarMessage(message)
    setSeverity(severity)
  }

  const handleEdit = async (id, name, tax_value, active) => {
    setEditParams({ id: id, name: name, tax_value: tax_value, active: active })
    setOpenDrawer(true)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'label',
      headerName: 'TAX NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.label}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'tax_value',
      headerName: 'TAX',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatNumber(params.row.tax_value)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'active',
      headerName: 'STATUS',
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
      headerName: 'Action',
      renderCell: params => (
        <>
          {selectedPharmacy.type === 'central' &&
            (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
              <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
                {parseInt(params.row.zoo_id) === 0 ? null : (
                  <IconButton
                    size='small'
                    sx={{ mr: 0.5 }}
                    onClick={() => handleEdit(params.row.id, params.row.label, params.row.tax_value, params.row.active)}
                    aria-label='Edit'
                  >
                    <Icon icon='mdi:pencil-outline' />
                  </IconButton>
                )}
              </Box>
            )}
        </>
      )
    }
  ]

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, tax_value: null, active: null })
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  function loadServerRows(currentPage, data) {
    return data
  }

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

        await getGstList({ params: params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
        })
        setLoading(false)
      } catch (e) {
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

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <AddButton title='Add GST' action={() => addEventSidebarOpen()} />
        )}
    </div>
  )

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateTax(editParams?.id, payload)
      } else {
        response = await addTax(payload)
      }

      if (response?.success) {
        setAlertDefaults({ status: true, message: response?.message, severity: 'success' })

        setSubmitLoader(false)
        setResetForm(true)

        await fetchTableData(sort, searchValue, sortColumn)
        setOpenDrawer(false)
      } else {
        setSubmitLoader(false)
        setAlertDefaults({ status: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      //console.log(e)
      setSubmitLoader(false)
      setAlertDefaults({ status: true, message: 'Error', severity: 'error' })
    }
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <Card>
                <CardHeader title='GST' action={headerAction} />
                <DataGrid
                  columnVisibilityModel={{
                    id: false
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
                  slots={{ toolbar: ServerSideToolbar }}
                  onPaginationModelChange={setPaginationModel}
                  loading={loading}
                  disableColumnMenu
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
                />
              </Card>
              {/* sx={{ '& .MuiDrawer-paper': { width: ['100%', drawerWidth] } }} */}
              <AddGstSlabs
                drawerWidth={400}
                addEventSidebarOpen={openDrawer}
                handleSidebarClose={handleSidebarClose}
                handleSubmitData={handleSubmitData}
                resetForm={resetForm}
                submitLoader={submitLoader}
                editParams={editParams}
              />
              <UserSnackbar
                status={openSnackbar}
                message={snackbarMessage}
                severity={severity}
                handleClose={handleClose}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default ListOfGst
