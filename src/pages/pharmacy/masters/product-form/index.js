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
import { Box, Grid, TextField } from '@mui/material'
import { debounce } from 'lodash'
import { useTheme } from '@emotion/react'

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
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'

const ListOfDosageForms = () => {
  const theme = useTheme()

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
      minWidth: 60,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      minWidth: 350,
      field: 'label',
      headerName: 'Product Form',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.label}
        </Typography>
      )
    },

    {
      minWidth: 250,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.status}
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      minWidth: 250,
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
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
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

      {pharmacyRole && (
        <Grid item>
          <AddButtonContained title='Add Product Form' action={() => addEventSidebarOpen()} fullWidth='fullWidth' />
        </Grid>
      )}
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
                <CardHeader
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'flex-start', // Align content to the left
                    alignItems: 'flex-start', // Align items to the top left
                    gap: { xs: 3, sm: 0 },
                    '& .MuiCardHeader-action': {
                      width: { xs: '100% ', sm: 'auto' }
                    }
                  }}
                  title={RenderUtility.pageTitle('Product Form List')}
                  action={headerAction}
                />

                {/* Left Box (Search Field) */}
                <Grid
                  item
                  sx={{
                    mx: { xs: 4 },
                    ml: { md: 4 }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                      borderRadius: '8px',
                      padding: '0 8px',
                      height: '40px',
                      width: {
                        xs: '100%',
                        sm: '250px'
                      }
                    }}
                  >
                    <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                    <TextField
                      variant='outlined'
                      placeholder='Search...'
                      onChange={e => handleSearch(e.target.value)}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          border: 'none',
                          padding: '0',
                          '& fieldset': {
                            border: 'none'
                          }
                        }
                      }}
                    />
                  </Box>
                </Grid>
                <Grid
                  sx={{
                    mx: { xs: 4 }
                  }}
                >
                  <CommonTable
                    onRowClick={''}
                    indexedRows={indexedRows}
                    total={total}
                    columns={columns}
                    paginationModel={paginationModel}
                    handleSortModel={handleSortModel}
                    setPaginationModel={setPaginationModel}
                    loading={loading}
                    searchValue={searchValue}
                  />
                </Grid>
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
