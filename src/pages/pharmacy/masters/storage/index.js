import React, { useState, useEffect, useCallback } from 'react'

import { getStorage, updateStorage } from 'src/lib/api/pharmacy/storage'

import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import { useTheme } from '@emotion/react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Grid, Tooltip, Typography, IconButton } from '@mui/material'

import { debounce } from 'lodash'

import toast from 'react-hot-toast'

import AddStorage from 'src/views/pages/pharmacy/medicine/storage/addStorage'
import { addStorage } from 'src/lib/api/pharmacy/storage'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { ExportButton } from 'src/views/utility/render-snippets'

const StorageList = () => {
  const theme = useTheme()
  const [saltsList, setSaltsList] = useState([])
  const [loader, setLoader] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

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
      minWidth: 100,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      flex: 1,
      minWidth: 250,
      field: 'label',
      headerName: 'Storage',
      renderCell: params => (
        <Tooltip title={`${params.row.label}°C`}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {params?.row?.label}
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.2,
      minWidth: 250,
      field: 'active',
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
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 250,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <>
          {pharmacyRole && (
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
          )}
        </>
      )
    }
  ]

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

        await getStorage({ params: params }).then(res => {
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
      {pharmacyRole && (
        <Grid item>
          <AddButtonContained
            title='Add Storage'
            styles={{ margin: 0 }}
            action={() => addEventSidebarOpen()}
            fullWidth='fullWidth'
          />
        </Grid>
      )}
    </div>
  )

  const handleSubmitData = async (payload, id) => {
    try {
      setSubmitLoader(true)
      var response
      if (id !== null) {
        response = await updateStorage(id, payload)
      } else {
        response = await addStorage(payload)
      }
      if (response?.success) {
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
      }
    } catch (e) {
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleExport = async () => {
    const params = {
      q: searchValue,
      sort: sort,
      column: sortColumn,
      response_type: 'csv'
    }
    try {
      setExportLoading(true)
      const response = await getStorage({ params })

      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response?.data)
        setExportLoading(false)
      }
    } catch (error) {
      console.log('error downloading excel', error)
      setExportLoading(false)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <>
      {pharmacyRole ? (
        <>
          {loader ? (
            <FallbackSpinner />
          ) : (
            <>
              <PageCardLayout title={'Storage'} action={headerAction}>
                <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <Grid item size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
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
                  <Grid item>
                    <ExportButton onClick={handleExport} loading={loading || exportLoading} disabled={total === 0} />
                  </Grid>
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
              <AddStorage
                drawerWidth={400}
                addEventSidebarOpen={openDrawer}
                handleSidebarClose={handleSidebarClose}
                handleSubmitData={handleSubmitData}
                resetForm={resetForm}
                submitLoader={submitLoader}
                editParams={editParams}
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

export default StorageList
