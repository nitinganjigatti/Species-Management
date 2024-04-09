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
import { Box } from '@mui/material'

import Router from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton } from 'src/components/Buttons'

const ListOfRacks = () => {
  const [racks, setRacks] = useState([])
  const [loader, setLoader] = useState(false)
  const [deleteRowId, setDeleteRowId] = useState('')

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
      console.log('rack list', response)
      if (response?.success) {
        toast.success(response?.data)

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
  }, [selectedPharmacy.id])

  // useEffect(() => {
  //   getRacksLists()
  // }, [selectedPharmacy])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'store_name',
      headerName: 'STORE NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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

  const addRackButton = (
    <div>
      {(selectedPharmacy?.permission?.pharmacy_module === 'allow_full_access' ||
        selectedPharmacy?.permission?.pharmacy_module === 'ADD') && (
        <AddButton title='Add Rack' action={() => addEventSidebarOpen()} />
      )}
    </div>
  )

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <TableWithFilter TableTitle='Rack List' headerActions={addRackButton} columns={columns} rows={racks} />

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
          />
          {openSnackbar.open ? (
            <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
          ) : null}
        </>
      )}
    </>
  )
}

export default ListOfRacks
