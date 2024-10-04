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
import { Box, Drawer } from '@mui/material'
import IconButton from '@mui/material/IconButton'

import { AddButton } from 'src/components/Buttons'

import AddStates from 'src/views/pages/pharmacy/medicine/state/addState'

// import UserSnackbar from 'src/components/utility/snackbar'

import Error404 from 'src/pages/404'

import { debounce } from 'lodash'

import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'

const ListOfStates = () => {
  const [stateList, setStateList] = useState([])
  const [loader, setLoader] = useState(false)

  /*** Drawer ****/
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
      flex: 0.05,
      Width: 40,
      field: 'uid',
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
      field: 'name',
      headerName: 'STATE NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'capitalize' }}>
          {params.row.name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'code',
      headerName: 'STATE CODE',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.code}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'short_code',
      headerName: 'SHORT CODE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', textTransform: 'uppercase' }}>
          {params.row.short_code}
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
      {/* {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && ( */}
      {pharmacyRole && <AddButton title='Add State' action={() => addEventSidebarOpen()} />}
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
                <CardHeader title='State List' action={headerAction} />
                <DataGrid
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
                />
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
              {/* {openSnackbar.open ? (
                <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
              ) : null} */}
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
