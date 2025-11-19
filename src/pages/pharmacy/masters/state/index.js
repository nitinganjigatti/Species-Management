import React, { useState, useEffect, useCallback } from 'react'

import { getStates, addState, updateStates } from 'src/lib/api/pharmacy/getStates'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

import toast from 'react-hot-toast'

// ** MUI Imports

import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Drawer, Grid, TextField } from '@mui/material'
import IconButton from '@mui/material/IconButton'

import { useTheme } from '@emotion/react'

import { AddButton } from 'src/components/Buttons'

import AddStates from 'src/views/pages/pharmacy/medicine/state/addState'

import Error404 from 'src/pages/404'

import { debounce } from 'lodash'

import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import MUISearch from 'src/views/forms/form-fields/MUISearch'

const ListOfStates = () => {
  const theme = useTheme()

  const [stateList, setStateList] = useState([])
  const [loader, setLoader] = useState(false)

  const editParamsInitialState = { id: null, name: null, status: null, code: null, short_code: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const authData = useContext(AuthContext)
  const pharmacyRole = authData?.userData?.roles?.settings?.add_pharmacy

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, name: null, status: null, code: null, short_code: null })
    setResetForm(true)

    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateStates(editParams?.id, payload)
      } else {
        response = await addState(payload)
      }

      if (response?.success) {
        toast.success(response?.data)
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        await fetchTableData(sort, searchValue, sortColumn)
      } else {
        setSubmitLoader(false)

        if (typeof response.message === 'object') {
          Utility.errorMessageExtractorFromObject(response.message)
        } else {
          toast.error(JSON.stringify(response.message))
        }
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const handleEdit = async (id, name, code, short_code, status) => {
    setEditParams({ id: id, name: name, code: code, short_code: short_code, status: status })
    setOpenDrawer(true)
  }

  /***** Drawer  */

  // const getStatesLists = async () => {
  //   setLoader(true)
  //   const response = await getStates()
  //   if (response?.length > 0) {
  //     // response.sort((a, b) => a.id - b.id)
  //     let listWithId = response
  //       ? response.map((el, i) => {
  //           return { ...el, uid: i + 1 }
  //         })
  //       : []
  //     setStateList(listWithId)
  //     setLoader(false)
  //   } else {
  //     setLoader(false)
  //   }
  // }

  // useEffect(() => {
  //   getStatesLists()
  // }, [])

  const columns = [
    {
      minWidth: 90,
      field: 'uid',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      minWidth: 300,
      field: 'name',
      headerName: 'STATE NAME',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'capitalize',
            fontFamily: 'Inter'
          }}
        >
          {params.row.name}
        </Typography>
      )
    },

    {
      minWidth: 180,
      field: 'code',
      headerName: 'STATE CODE',
      type: 'number',
      align: 'left',
      headerAlign: 'left',
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
          {params.row.code}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'short_code',
      headerName: 'SHORT CODE',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'uppercase',
            fontFamily: 'Inter'
          }}
        >
          {params.row.short_code}
        </Typography>
      )
    },
    {
      minWidth: 180,

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
          {params.row.status
            ? params.row.status.charAt(0).toUpperCase() + params.row.status.slice(1).toLowerCase()
            : ''}
        </Typography>
      )
    },
    {
      minWidth: 180,

      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <>
          {pharmacyRole && (
            <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
              <IconButton
                size='small'
                sx={{ mr: 0.5 }}
                onClick={() =>
                  handleEdit(params.row.id, params.row.name, params.row.code, params.row.short_code, params.row.status)
                }
                aria-label='Edit'
              >
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
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

        await getStates({ params: params }).then(res => {
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
          <AddButtonContained title='Add State' action={() => addEventSidebarOpen()} fullWidth='fullWidth' />
        </Grid>
      )}
    </div>
  )

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
              {/* <TableWithFilter
                TableTitle={stateList.length > 0 ? 'State List' : 'State list is empty add State'}
                headerActions={
                  <div>
                    <AddButton title={'Add State'} action={() => addEventSidebarOpen()}></AddButton>
                  </div>
                }
                columns={columns}
                rows={stateList}
              /> */}

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
                  title={RenderUtility.pageTitle('State List')}
                  action={headerAction}
                />

                <Grid
                  item
                  sx={{
                    mx: { xs: 4 },
                    ml: { md: 4 }
                  }}
                >
                  {/* <Box
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
                  </Box> */}
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

                <Grid sx={{ mx: 4 }}>
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

                {/* <DataGrid
                  columnVisibilityModel={{
                    uid: false
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
                /> */}
              </Card>
              <AddStates
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

export default ListOfStates
