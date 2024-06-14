import React, { useState, useEffect, useCallback } from 'react'

import { addProductForm, getProductFormList, updateProductForm } from 'src/lib/api/pharmacy/productForms'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'
import { debounce } from 'lodash'

import Router from 'next/router'
import toast from 'react-hot-toast'

import AddProductForm from 'src/views/pages/pharmacy/medicine/dosageForm/addProductForm'

// import UserSnackbar from 'src/components/utility/snackbar'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import { AddButton } from 'src/components/Buttons'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'

const ListOfDosageForms = () => {
  const [dosageForms, setDosageForms] = useState([])
  const [loader, setLoader] = useState(false)

  /*** Drawer ****/
  const editParamsInitialState = { id: null, name: null, active: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [severity, setSeverity] = useState('success')

  const { selectedPharmacy } = usePharmacyContext()

  const authData = useContext(AuthContext)
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy

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

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, active: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleEdit = async (id, name, active) => {
    setEditParams({ id: id, name: name, active: active })
    setOpenDrawer(true)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL No',
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
      headerName: 'Product Form',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.label}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.status}
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
          {/* {
           selectedPharmacy.type === 'central' &&
             (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && ( */}
          {pharmacyRole && (
            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
              {parseInt(params.row.zoo_id) === 0 ? null : (
                <IconButton
                  size='small'
                  sx={{ mr: 0.5 }}
                  onClick={() => handleEdit(params.row.id, params.row.label, params.row.active)}
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

  /***** Serverside pagination */
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

        await getProductFormList({ params: params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
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
  }, [fetchTableData, selectedPharmacy?.id])

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
      {/* {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && ( */}
      {pharmacyRole && <AddButton title='Add Product Form' action={() => addEventSidebarOpen()} />}
    </div>
  )

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateProductForm(editParams?.id, payload)
      } else {
        response = await addProductForm(payload)
      }

      if (response?.success) {
        // setAlertDefaults({ status: true, message: response?.message, severity: 'success' })
        toast.success(response?.message)

        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        await fetchTableData(sort, searchValue, sortColumn)
      } else {
        setSubmitLoader(false)
        if (typeof response?.message === 'object') {
          Utility.errorMessageExtractorFromObject(response.message)
        } else {
          toast.error(response.message)
        }

        // setAlertDefaults({ status: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      setSubmitLoader(false)

      // setAlertDefaults({ status: true, message: 'Error', severity: 'error' })
      toast.error(JSON.stringify(e))
    }
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {/* {selectedPharmacy.type === 'central' ? ( */}
      {pharmacyRole ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <Card>
                <CardHeader title='Product Form List' action={headerAction} />
                <DataGrid
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
              <AddProductForm
                drawerWidth={400}
                addEventSidebarOpen={openDrawer}
                handleSidebarClose={handleSidebarClose}
                handleSubmitData={handleSubmitData}
                resetForm={resetForm}
                submitLoader={submitLoader}
                editParams={editParams}
              />
              {/* <UserSnackbar
                status={openSnackbar}
                message={snackbarMessage}
                severity={severity}
                handleClose={handleClose}
              /> */}
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

export default ListOfDosageForms
