import React, { useState, useEffect, useCallback } from 'react'

import { getUnits, addUnits, updateUnits } from 'src/lib/api/pharmacy/getUnits'
import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

// import Typography from '@mui/material/Typography'
import { Box, Grid, Typography, IconButton } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'

import { debounce } from 'lodash'
import toast from 'react-hot-toast'

import AddUOM from 'src/views/pages/pharmacy/medicine/uom/addUom'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility, { pageTitle } from 'src/utility/render'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import { ExportButton } from 'src/views/utility/render-snippets'
// import SessionGuard from 'src/components/SessionGuard'

const ListOfUOM = () => {
  const theme = useTheme()
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
      // flex: 0.2,
      Width: 150,
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
      field: 'unit_name',
      headerName: 'UOM NAME',
      textAlign: 'center',
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
          {params.row.unit_name}
        </Typography>
      )
    },

    {
      // flex: 0.2,
      minWidth: 250,
      field: 'active',
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
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      // flex: 0.2,
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
      {pharmacyRole && (
        <Grid item>
          <AddButtonContained
            title='Add UOM '
            action={() => addEventSidebarOpen()}
            fullWidth='fullWidth'
            styles={{
              margin: 0
            }}
          />
        </Grid>
      )}
    </div>
  )

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('unit_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
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
      console.log(e)
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
    try {
      setExportLoading(true)

      const params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        response_type: 'csv'
      }
      const response = await getUnits({ params })

      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response?.data)
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
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
              {/* <SessionGuard
                warnMinutes={4}
                criticalMinutes={2}
                customMessage={`Please save your changes to avoid data loss`}
              /> */}

              <PageCardLayout title='UOM (Unit of Measurement) List' action={headerAction}>
                <Grid container>
                  <Grid item container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <Grid size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
                      <MUISearch
                        sx={{
                          width: {
                            xs: '100%',
                            sm: '250px'
                          }
                        }}
                        placeholder='Search...'
                        value={searchValue}
                        onChange={e => handleSearch(e.target.value)}
                        onClear={() => handleSearch('')}
                      />
                    </Grid>
                    <Grid>
                      <ExportButton onClick={handleExport} loading={loading || exportLoading} disabled={total === 0} />
                    </Grid>
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
