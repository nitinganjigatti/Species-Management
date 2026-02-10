import React, { useState, useEffect, useCallback } from 'react'

import {
  getStoreList,
  addStore,
  updateStore,
  deleteStoreById,
  checkCentralPharmacy
} from 'src/lib/api/pharmacy/getStoreList'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Tooltip, IconButton, Typography, Button, Grid } from '@mui/material'

import { debounce } from 'lodash'

import AddStore from 'src/views/pages/pharmacy/store/store/addStore'

import Error404 from 'src/pages/404'

import { useTheme } from '@emotion/react'
import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import toast from 'react-hot-toast'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import { LoadingButton } from '@mui/lab'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

const ListOfStores = () => {
  const theme = useTheme()

  const [stores, setStores] = useState([])
  const [loader, setLoader] = useState(false)

  const editParamsInitialState = { id: null, name: null, status: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const authData = useContext(AuthContext)
  const [validateStore, setValidateStore] = useState(false)
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy
  const pharmacyList = authData?.userData?.modules?.pharmacy_data?.pharmacy
  const [tempPayload, setTempPayload] = useState(null)
  const [deleteStore, setDeleteStore] = useState(false)
  console.log('pharmacyRole', pharmacyRole)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, status: null })
    setResetForm(true)
    console.log(editParams)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleEdit = async (id, name, status) => {
    setEditParams({ id: id, name: name, status: status })
    setOpenDrawer(true)
  }

  const openStoreValidate = () => {
    setValidateStore(true)
  }

  const closeStoreValidate = () => {
    setValidateStore(false)
    setTempPayload(null)
    setDeleteStore(false)
  }

  const columns = [
    {
      minWidth: 100,
      field: 'sl_no',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no + '.'}
        </Typography>
      )
    },
    {
      minWidth: 150,
      field: 'type',
      headerName: 'TYPE',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.type}
        </Typography>
      )
    },
    {
      minWidth: 250,
      field: 'name',
      headerName: 'PHARMACY NAME',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.name}
        </Typography>
      )
    },
    {
      minWidth: 150,
      field: 'latitude',
      headerName: 'LATITUDE',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.latitude ? params.row.latitude : '-'}
        </Typography>
      )
    },
    {
      minWidth: 150,
      field: 'logitude',
      headerName: 'LONGITUDE',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.logitude ? params.row.logitude : '-'}
        </Typography>
      )
    },

    {
      minWidth: 250,
      field: 'site_name',
      headerName: 'Site Name',
      renderCell: params => (
        <Tooltip title={params.row.site_name ? params.row.site_name : '-'}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {params.row.site_name ? params.row.site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },

    {
      minWidth: 150,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.status
            ? params.row.status.charAt(0).toUpperCase() + params.row.status.slice(1).toLowerCase()
            : ''}
        </Typography>
      )
    },
    {
      minWidth: 150,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <>
          {/* {(selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && ( */}
          {/* {pharmacyRole && params?.row?.type === 'local' && ( */}
          <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
            {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:eye-outline' />
          </IconButton> */}
            <IconButton
              size='small'
              sx={{ mr: 0.5 }}
              onClick={() => handleEdit(params?.row.id, params?.row.name, params?.row.status)}
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
            {pharmacyRole && params?.row?.type === 'local' && (
              <IconButton
                size='small'
                sx={{ mr: 0.5 }}
                onClick={() => {
                  console.log('parass', params?.row)
                  setEditParams({ id: params?.row?.id, name: params?.row?.name, status: params?.row?.status })
                  setDeleteStore(true)
                  openStoreValidate()
                }}
              >
                <Icon icon='mdi:delete-outline' />
              </IconButton>
            )}
          </Box>
          {/* )} */}
        </>
      )
    }
  ]

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
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
          limit: paginationModel.pageSize,
          is_access: 1
        }

        await getStoreList({ params: params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
        })
        setLoading(false)
      } catch (e) {
        setTotal(0)
        setRows([])
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
      {pharmacyRole && (
        <Grid item>
          <AddButtonContained
            title='Add Pharmacy'
            styles={{ margin: 0 }}
            action={() => addEventSidebarOpen()}
            fullWidth='fullWidth'
          />
        </Grid>
      )}
    </div>
  )

  const checkPharmacy = async () => {
    try {
      var response = await checkCentralPharmacy()

      return response?.success
    } catch (e) {
      console.log(e)
    }
  }

  const handleResponse = response => {
    if (response?.success) {
      toast.success(response?.message)
      setSubmitLoader(false)
      setResetForm(true)
      setOpenDrawer(false)
      setTempPayload(null)
      closeStoreValidate()
      fetchTableData(sort, searchValue, sortColumn)

      // Router.reload()
    } else {
      setSubmitLoader(false)
      if (typeof response?.message === 'object') {
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        setTempPayload(null)
        closeStoreValidate()
        Utility.errorMessageExtractorFromObject(response?.message)
      } else {
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        setTempPayload(null)
        closeStoreValidate()
        toast.error(response?.message)
      }
    }
    setSubmitLoader(false)
  }

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)

      var response
      if (editParams?.id !== null) {
        if (payload?.status === 'inactive') {
          openStoreValidate()
          setTempPayload(payload)
          setSubmitLoader(false)

          return
        }
        response = await updateStore(editParams?.id, payload)
      } else {
        var pharmacyCheck = await checkPharmacy()

        if (typeof pharmacyCheck === 'boolean') {
          payload.type = pharmacyCheck ? 'local' : 'central'
          console.log('Pharmacy')

          response = await addStore(payload)
        } else {
          throw "Sorry.. Can't add pharmacy right now"
        }
      }
      handleResponse(response)

      // if (response?.success) {
      //   toast.success(response?.message)
      //   setSubmitLoader(false)
      //   setResetForm(true)
      //   setOpenDrawer(false)
      //   setTempPayload(null)

      //   // Router.reload()
      // } else {
      //   setSubmitLoader(false)
      //   if (typeof response?.message === 'object') {
      //     Utility.errorMessageExtractorFromObject(response?.message)
      //   } else {
      //     toast.error(response?.message)
      //   }
      // }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const confirmInactiveStatus = async payload => {
    if (payload !== '') {
      try {
        setSubmitLoader(true)
        const response = await updateStore(editParams?.id, payload)
        handleResponse(response)
        closeStoreValidate()
        setTempPayload(null)
      } catch (error) {
        console.error(error)
        closeStoreValidate()

        setSubmitLoader(false)
        toast.error(error.message || JSON.stringify(error))
      }
    }
  }

  const deletePharmacy = async () => {
    if (editParams?.id !== '') {
      try {
        setSubmitLoader(true)
        const response = await deleteStoreById(editParams?.id)

        handleResponse(response)

        // closeStoreValidate()
        // setTempPayload(null)
      } catch (error) {
        console.error(error)

        // handleResponse(response)
      }
    }
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {pharmacyRole ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <PageCardLayout title={'Pharmacy List'} action={headerAction}>
                <Grid item>
                  <MUISearch
                    sx={{
                      width: {
                        xs: '100%',
                        sm: '250px'
                      }
                    }}
                    placeholder='Search...'
                    onChange={e => handleSearch(e.target.value)}
                    onClear={() => handleSearch('')}
                    value={searchValue}
                  />
                </Grid>
                <Grid>
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
              </PageCardLayout>
              <AddStore
                drawerWidth={400}
                addEventSidebarOpen={openDrawer}
                handleSidebarClose={handleSidebarClose}
                handleSubmitData={handleSubmitData}
                resetForm={resetForm}
                submitLoader={submitLoader}
                editParams={editParams}
                pharmacyList={pharmacyList}
                totalStores={total}
              />
              <ConfirmDialogBox
                open={validateStore}
                closeDialog={() => {
                  closeStoreValidate()
                }}
                action={() => {
                  closeStoreValidate()
                }}
                title={
                  <Box
                    sx={{
                      fontWeight: 500,
                      fontSize: '20px',
                      margin: '0px',
                      padding: '0px',
                      color: 'customColors.OnSurfaceVariant',
                      display: 'flex',
                      gap: deleteStore ? 2 : 4,
                      alignItems: 'center'
                    }}
                  >
                    {deleteStore ? (
                      <Icon
                        style={{
                          cursor: 'pointer',
                          cursor: 'pointer',
                          color: theme.palette.customColors.Error,
                          height: '30px',
                          width: '26px'
                        }}
                        icon='material-symbols:delete-outline-rounded'
                      />
                    ) : (
                      <>
                        <Icon
                          style={{
                            cursor: 'pointer',
                            cursor: 'pointer',
                            position: 'relative',
                            height: '16px',
                            width: '17px'
                          }}
                          icon='fa6-solid:power-off'
                        />
                        <Icon
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            cursor: 'pointer',
                            left: '18.5px',
                            color: theme.palette.customColors.Tertiary,
                            height: '28px',
                            width: '28px'
                          }}
                          icon='heroicons:no-symbol-16-solid'
                        />
                      </>

                      // <Icon
                      //   style={{
                      //     cursor: 'pointer',
                      //     cursor: 'pointer',
                      //     color: theme.palette.customColors.Tertiary,
                      //     height: '30px',
                      //     width: '26px'
                      //   }}
                      //   icon='pepicons-pop:power-circle-off'
                      // />
                    )}
                    {deleteStore ? 'Delete Pharmacy !' : 'Inactivate Pharmacy!'}
                  </Box>
                }
                content={
                  <>
                    {deleteStore ? (
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          margin: '0px',
                          padding: '0px',
                          color: 'customColors.OnSurfaceVariant'
                        }}
                      >
                        Are you sure you want to delete
                        <Typography
                          component='span'
                          sx={{
                            color: 'customColors.Error',
                            fontWeight: 600,
                            fontSize: '16px',
                            px: 2
                          }}
                        >
                          {editParams?.name ? editParams?.name : ''}
                        </Typography>
                        <spn>?</spn>
                        <br />
                        If needed, you can create a new pharmacy after completing this deletion.
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          margin: '0px',
                          padding: '0px',
                          color: 'customColors.OnSurfaceVariant'
                        }}
                      >
                        Are you sure you want to inactivate the
                        <Typography
                          component='span'
                          sx={{
                            color: 'customColors.Tertiary',
                            fontWeight: 600,
                            fontSize: '16px',
                            px: 2
                          }}
                        >
                          {editParams?.name ? editParams?.name : ''}
                        </Typography>
                        <spn>?</spn>
                        <br />
                        Ensure that all stock is transferred to other pharmacies before proceeding with inactivation.
                      </Typography>
                    )}
                  </>
                }
                dialogActions={
                  <>
                    <Button
                      variant='outlined'
                      size='large'
                      sx={{
                        color: 'customColors.neutralSecondary',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        ':hover': {
                          color: theme.palette.customColors.neutralSecondary,
                          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                          backgroundColor: 'transparent !important'
                        }
                      }}
                      onClick={() => {
                        closeStoreValidate()
                      }}
                    >
                      Cancel
                    </Button>
                    {deleteStore ? (
                      <LoadingButton
                        variant='contained'
                        color='error'
                        size='large'
                        loading={submitLoader}
                        onClick={() => {
                          if (deleteStore) {
                            deletePharmacy()
                          } else {
                            confirmInactiveStatus(tempPayload)
                          }
                        }}
                      >
                        Delete
                      </LoadingButton>
                    ) : (
                      <LoadingButton
                        variant='contained'
                        size='large'
                        style={{
                          color: 'customColors.neutralSecondary',
                          border: `1px solid ${theme.palette.customColors.Tertiary}`,
                          backgroundColor: theme.palette.customColors.Tertiary,
                          ':hover': {
                            color: theme.palette.customColors.neutralSecondary,
                            border: `1px solid ${theme.palette.customColors.Tertiary}`,
                            backgroundColor: theme.palette.customColors.Tertiary
                          }
                        }}
                        loading={submitLoader}
                        onClick={() => {
                          if (deleteStore) {
                            deletePharmacy()
                          } else {
                            confirmInactiveStatus(tempPayload)
                          }
                        }}
                      >
                        Confirm
                      </LoadingButton>
                    )}
                  </>
                }
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

export default ListOfStores
