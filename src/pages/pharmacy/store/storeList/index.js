import React, { useState, useEffect } from 'react'

import { getStoreList, addStore, updateStore } from 'src/lib/api/getStoreList'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router from 'next/router'
import AddStore from 'src/views/pages/pharmacy/store/store/addStore'
import UserSnackbar from 'src/components/utility/snackbar'

const ListOfStores = () => {
  const [stores, setStores] = useState([])
  const [loader, setLoader] = useState(false)

  /*** Drawer ****/
  const editParamsInitialState = { id: null, name: null, status: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const addEventSidebarOpen = () => {
    console.log('event clicked')
    setEditParams({ id: null, name: null, status: null })
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
        response = await updateStore(editParams?.id, payload)
      } else {
        response = await addStore(payload)
      }

      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        await getStoresLists()
      } else {
        setSubmitLoader(false)
        console.log('test')
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message?.name, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  const handleEdit = async (id, name, status) => {
    setEditParams({ id: id, name: name, status: status })
    setOpenDrawer(true)
  }

  /***** Drawer  */

  const getStoresLists = async () => {
    setLoader(true)
    const response = await getStoreList()
    if (response?.length > 0) {
      console.log('list', response)

      // response.sort((a, b) => a.id - b.id)
      let listWithId = response
        ? response.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
        : []
      setStores(listWithId)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    getStoresLists()
  }, [])

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
      field: 'type',
      headerName: 'TYPE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.type}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'name',
      headerName: 'STORE NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'latitude',
      headerName: 'LATITUDE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.latitude}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'logitude',
      headerName: 'LOGITUDE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.logitude}
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
          {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:eye-outline' />
          </IconButton> */}
          <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={() => handleEdit(params.row.id, params.row.name, params.row.status)}
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:delete-outline' />
          </IconButton> */}
        </Box>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <TableWithFilter
            TableTitle={stores.length > 0 ? 'Store List' : 'Store List is empty add Store List'}
            headerActions={
              <div>
                <Button size='big' variant='contained' onClick={() => addEventSidebarOpen()}>
                  Add Store
                </Button>
              </div>
            }
            columns={columns}
            rows={stores}
          />
          <AddStore
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

export default ListOfStores
