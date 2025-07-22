import React, { useState, useEffect, useCallback } from 'react'

import { getRackList, addRackList, updateRackList, deleteRackItem } from 'src/lib/api/pharmacy/getRackList'
import UserSnackbar from 'src/components/utility/snackbar'
import AddRack from 'src/views/pages/pharmacy/store/rack/addRack'
import toast from 'react-hot-toast'
import ConfirmDialog from 'src/components/ConfirmationDialog'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, CardHeader, TextField } from '@mui/material'
import { useTheme } from '@emotion/react'

import { useRouter } from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import { debounce } from 'lodash'

const ListOfRacks = () => {
  const theme = useTheme()
  const router = useRouter()

  const [racks, setRacks] = useState([])
  const [loader, setLoader] = useState(false)
  const [deleteRowId, setDeleteRowId] = useState('')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [total, setTotal] = useState(0)
  const [refetchData, setRefetchData] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'name')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  // ** State
  const [open, setOpen] = useState(false)
  const handleClickOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  /*** Drawer ****/
  const editParamsInitialState = { id: null, name: null, position: null, store_id: null, shelf: null, status: 'active' }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const { selectedPharmacy } = usePharmacyContext()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const addEventSidebarOpen = () => {
    console.log('event clicked')
    setEditParams({ id: null, name: null, position: null, store_id: null, shelf: null, status: 'active' })
    setResetForm(true)
    console.log(editParams)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    console.log('close event clicked')
    setOpenDrawer(false)
  }

  const handleSubmitData = async payload => {
    console.log('payload', payload)
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateRackList(editParams?.id, payload)
      } else {
        response = await addRackList(payload)
      }
      if (response?.success) {
        toast.success(response?.message)
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        setRefetchData(!refetchData)
      } else {
        setSubmitLoader(false)
        toast.error(response?.message)
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
    }
  }

  const handleEdit = async (id, name, position, store_id, shelf, status) => {
    setEditParams({
      id: id,
      name: name,
      store_id: store_id,
      position: position,
      shelf: shelf,
      status: status
    })
    setOpenDrawer(true)
  }

  const confirmDeleteAction = async () => {
    console.log(deleteRowId)
    const response = await deleteRackItem(deleteRowId)

    if (response?.success) {
      handleClose()
      toast.success(response?.data)
      setRefetchData(!refetchData)
      setDeleteRowId('')
    } else {
      handleClose()
      toast.error(response?.data)
    }
  }

  const getRacksLists = useCallback(async ({ q, page, limit, sort, column }) => {
    try {
      setLoader(true)

      const params = {
        q: q,
        page: page + 1,
        limit: limit,
        sort: sort,
        column: column
      }

      await getRackList({ params }).then(res => {
        if (res?.success && res?.data?.racks?.length > 0) {
          setTotal(parseInt(res?.data?.total_count))
          setRacks(res?.data?.racks)
        } else {
          setRacks([])
          setTotal(0)
        }
      })
      setLoader(false)
    } catch (error) {
      console.error('Error fetching Rack Lists', error)
      setLoader(false)
    }
  }, [])

  useEffect(() => {
    getRacksLists({
      q: searchValue,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      sort,
      column: sortColumn
    })
    updateUrlParams({
      q: searchValue,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      sort,
      column: sortColumn
    })
  }, [selectedPharmacy?.id, paginationModel?.page, paginationModel?.pageSize, refetchData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = racks?.map((row, index) => ({
    ...row,
    uid: getSlNo(index)
  }))

  const columns = [
    {
      flex: 0.1,
      Width: 40,
      field: 'uid',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid + '.'}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'store_name',
      headerName: 'STORE NAME',
      sortable: false,
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
          {params.row.store_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'name',
      headerName: 'RACK NAME',
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
          {params.row.name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'shelfs',
      headerName: 'SHELFS',
      sortable: false,
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
          {params.row.shelfs}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'position',
      headerName: 'POSITION',
      sortable: false,
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
          {params.row.position}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
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
    ...(selectedPharmacy?.permission?.pharmacy_module !== 'VIEW'
      ? [
          {
            flex: 0.2,
            minWidth: 20,
            field: 'Action',
            sortable: false,
            headerName: 'Action',
            renderCell: params => (
              <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
                <IconButton
                  size='small'
                  sx={{ mr: 0.5 }}
                  onClick={() =>
                    handleEdit(
                      params.row.id,
                      params.row.name,
                      params.row.position,
                      params.row.store_id,
                      params.row.shelfs,
                      params.row.status
                    )
                  }
                >
                  <Icon icon='mdi:pencil-outline' />
                </IconButton>
                <IconButton
                  size='small'
                  sx={{ mr: 0.5 }}
                  onClick={() => {
                    setDeleteRowId(params.row.id)
                    handleClickOpen()
                  }}
                >
                  <Icon icon='mdi:delete-outline' />
                </IconButton>
              </Box>
            )
          }
        ]
      : [])

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
    //       <IconButton
    //         size='small'
    //         sx={{ mr: 0.5 }}
    //         onClick={() =>
    //           handleEdit(
    //             params.row.id,
    //             params.row.name,
    //             params.row.position,
    //             params.row.store_id,
    //             params.row.shelfs,
    //             params.row.status
    //           )
    //         }
    //       >
    //         <Icon icon='mdi:pencil-outline' />
    //       </IconButton>
    //       <IconButton
    //         size='small'
    //         sx={{ mr: 0.5 }}
    //         onClick={() => {
    //           setDeleteRowId(params.row.id)
    //           handleClickOpen()
    //         }}
    //       >
    //         <Icon icon='mdi:delete-outline' />
    //       </IconButton>
    //     </Box>
    //   )
    // }
  ]

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value, paginationModel?.page, paginationModel?.pageSize)
  }

  const searchTableData = useCallback(
    debounce(async (q, page, limit, sort, column) => {
      setSearchValue(q)
      try {
        await getRacksLists({ q, page: 0, limit, sort, column })
        updateUrlParams({
          q: q,
          page,
          limit,
          sort: sort,
          column: column
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      await getRacksLists({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize
      })

      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize
      })
    } else {
    }
  }

  const addRackButton = (
    <div>
      {(selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
        selectedPharmacy?.permission?.pharmacy_module === 'ADD') && (
        <AddButtonContained title='Add Rack' action={() => addEventSidebarOpen()} />
      )}
    </div>
  )

  return (
    <>
      <Card sx={{ cursor: 'pointer' }}>
        <CardHeader title={RenderUtility?.pageTitle('Rack List')} action={addRackButton} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Grid item size={{ xs: 8 }} sx={{ width: { xs: '100%', sm: '240px' } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #C3CEC7',
                m: { xs: 3 },
                marginLeft: { sm: 3, md: 5.5 },
                borderRadius: '8px',
                padding: '0 8px',

                height: '40px'
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
        </Box>
        <Grid
          sx={{
            mx: { xs: 2, sm: 3, md: 5 }
          }}
        >
          <CommonTable
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            loading={loader}
            searchValue={searchValue}
            handleSortModel={handleSortModel}
            onPaginationModelChange={model => {
              setPaginationModel(model)
              router.replace({
                pathname: router.pathname,
                query: {
                  ...router.query,
                  page: model.page + 1,
                  pageSize: model.pageSize,
                  searchValue,
                  sort,
                  sortColumn
                }
              })
            }}
          />
        </Grid>
      </Card>

      <ConfirmDialog
        closeDialog={handleClose}
        open={open}
        title='Confirmation'
        action={confirmDeleteAction}
        content='Are you sure want to delete?'
      />
      <AddRack
        drawerWidth={400}
        addEventSidebarOpen={openDrawer}
        handleSidebarClose={handleSidebarClose}
        handleSubmitData={handleSubmitData}
        resetForm={resetForm}
        submitLoader={submitLoader}
        editParams={editParams}
        selectedPharmacy={selectedPharmacy}
      />
      {openSnackbar?.open ? (
        <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
      ) : null}
    </>
  )
}

export default ListOfRacks
