import React, { useState, useEffect, useCallback } from 'react'

import { getUnits, addUnits, updateUnits } from 'src/lib/api/pharmacy/getUnits'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Drawer } from '@mui/material'
import IconButton from '@mui/material/IconButton'

// import UserSnackbar from 'src/components/utility/snackbar'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

import { debounce } from 'lodash'
import toast from 'react-hot-toast'

import Router from 'next/router'
import AddUOM from 'src/views/pages/pharmacy/medicine/uom/addUom'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import { AddButton } from 'src/components/Buttons'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'

const ListOfUOM = () => {
  const [uomList, setUomList] = useState([])
  const [loader, setLoader] = useState(false)

  /*** Drawer ****/
  const editParamsInitialState = { id: null, unit_name: null, active: null }
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

  const handleEdit = async (id, unit_name, active) => {
    setEditParams({ id: id, unit_name: unit_name, active: active })
    setOpenDrawer(true)
  }

  /***** Drawer  */

  // const getUOMLists = async () => {
  //   try {
  //     setLoader(true)
  //     const response = await getUnits()
  //     if (response.success) {
  //       setUomList(response.data)
  //       setLoader(false)
  //     } else {
  //       setLoader(false)
  //       setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify(response?.message), severity: 'error' })
  //     }
  //   } catch (e) {
  //     setLoader(false)
  //     setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify(e), severity: 'error' })
  //   }
  // }

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
      field: 'unit_name',
      headerName: 'UOM NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.unit_name}
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
          {/* selectedPharmacy.type === 'central' && (selectedPharmacy.permission.key === 'allow_full_access' ||
          selectedPharmacy.permission.key === 'ADD') && */}
          {pharmacyRole && (
            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
              {parseInt(params.row.zoo_id) === 0 ? null : (
                <IconButton
                  size='small'
                  sx={{ mr: 0.5 }}
                  onClick={() => handleEdit(params.row.id, params.row.unit_name, params.row.active)}
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

  const headerAction = (
    <div>
      {/* {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && ( */}
      {pharmacyRole && <AddButton title='Add UOM' action={() => addEventSidebarOpen()} />}
    </div>
  )

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('unit_name')
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

        await getUnits({ params: params }).then(res => {
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
        response = await updateUnits(editParams?.id, payload)
      } else {
        response = await addUnits(payload)
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

        // setAlertDefaults({ status: true, message: JSON.stringify(response?.message), severity: 'error' })
        if (typeof response?.message === 'object') {
          Utility.errorMessageExtractorFromObject(response.message)
        } else {
          toast.error(response.message)
        }
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)

      // setAlertDefaults({ status: true, message: JSON.stringify(e), severity: 'error' })
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
                <CardHeader title='UOM (Unit of Measurement) List' action={headerAction} />
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
              {/* <TableWithFilter
            TableTitle={
              uomList.length > 0 ? 'UOM (Unit of Measurement) List' : 'UOM (Unit of Measurement) List is empty add UOM'
            }
            headerActions={
              <div>
                <Button size='big' variant='contained' onClick={() => addEventSidebarOpen()}>
                  Add UOM
                </Button>
              </div>
            }
            columns={columns}
            rows={uomList}
          /> */}
              <AddUOM
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

export default ListOfUOM
