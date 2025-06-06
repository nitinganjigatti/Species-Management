import React, { useState, useEffect } from 'react'

import { getRackList, addRackList, updateRackList, deleteRackItem } from 'src/lib/api/pharmacy/getRackList'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import UserSnackbar from 'src/components/utility/snackbar'
import AddRack from 'src/views/pages/pharmacy/store/rack/addRack'
import DialogConfirmation from 'src/components/utility/DialogConfirmation'
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

import Router from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'

const ListOfRacks = () => {
  const theme = useTheme()

  const [racks, setRacks] = useState([])
  const [loader, setLoader] = useState(false)
  const [deleteRowId, setDeleteRowId] = useState('')
  const [data, setData] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState([])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

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

        // setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'success' })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        getRacksLists()

        // await getRacksLists()
      } else {
        setSubmitLoader(false)
        toast.error(response?.message)

        // setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)

      // setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
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
      getRacksLists()
      setDeleteRowId('')
    } else {
      handleClose()
      toast.error(response?.data)
    }
  }

  /***** Drawer  */

  const getRacksLists = async () => {
    try {
      setLoader(true)
      const response = await getRackList()
      if (response?.length > 0) {
        console.log('list', response)

        let listWithId = response
          ? response.map((el, i) => {
              return { ...el, uid: i + 1 }
            })
          : []
        setRacks(listWithId)
        setLoader(false)
      } else {
        setRacks([])
        setLoader(false)
      }
    } catch (error) {
      setLoader(false)
      setRacks([])
      console.log('error', error)
    }
  }

  useEffect(() => {
    getRacksLists()
  }, [selectedPharmacy?.id])

  useEffect(() => {
    setData(racks)
  }, [racks])

  // useEffect(() => {
  //   getRacksLists()
  // }, [selectedPharmacy])

  const escapeRegExp = value => {
    return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  }

  const handleSearch = searchValue => {
    setSearchText(searchValue)
    const searchRegex = new RegExp(escapeRegExp(searchValue), 'i')

    const filteredRows = data.filter(row => {
      return Object.keys(row).some(field => {
        // @ts-ignore
        //   return searchRegex.test(row[field].toString())
        // })
        return row[field]?.toString() && searchRegex.test(row[field].toString())
      })
    })
    if (searchValue.length) {
      setFilteredData(filteredRows)
    } else {
      setFilteredData([])
    }
  }

  const columns = [
    {
      flex: 0.1,
      Width: 40,
      field: 'uid',
      headerName: 'SL.NO',
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
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          {/* <TableWithFilter TableTitle={title} headerActions={addRackButton} columns={columns} rows={racks} /> */}
          <Card sx={{ cursor: 'pointer' }}>
            <CardHeader title={RenderUtility?.pageTitle('Rack List')} action={addRackButton} />

            <Box display='flex' justifyContent='space-between' alignItems='center'>
              {/* Left Box (Search Field) */}
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

              {/* <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', mr: 1 }}>
              {status === 'all' || status === 'completed' ? (
                <Box sx={{ float: 'right', mt: 1 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                    label='Completed'
                    labelPlacement='end'
                  />
                </Box>
              ) : null}
            </Grid> */}
            </Box>
            <Grid
              sx={{
                mx: { xs: 2, sm: 3, md: 5 }
              }}
            >
              <CommonTable
                onRowClick={''}
                indexedRows={filteredData?.length ? filteredData : data}
                total={''}
                columns={columns}
                paginationModel={paginationModel}
                handleSortModel={''}
                setPaginationModel={setPaginationModel}
                loading={''}
                searchValue={searchValue}
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
      )}
    </>
  )
}

export default ListOfRacks
