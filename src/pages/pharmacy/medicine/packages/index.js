import React, { useState, useEffect } from 'react'
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

import { getPackages, addPackages } from 'src/lib/api/packages'

import AddPackages from 'src/views/pages/pharmacy/medicine/packages/addPackages'
import UserSnackbar from 'src/components/utility/snackbar'
import { id } from 'date-fns/locale'

const ManufacturerList = () => {
  const [packages, setPackages] = useState([])
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
    setEditParams({ id: null, name: null, status: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    setOpenDrawer(false)
  }

  const handleSubmitData = async payload => {
    console.log(payload)

    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        // response = await updateManufacturer(editParams?.id, payload)
      } else {
        response = await addPackages(payload)
      }
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        await getPackagesList()
      } else {
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message?.name, severity: 'error' })
      }
    } catch (e) {
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  const handleEdit = async (id, name, status) => {
    setEditParams({ id: id, name: name, status: status })
    setOpenDrawer(true)
  }

  /***** Drawer  */

  const getPackagesList = async () => {
    try {
      setLoader(true)
      const response = await getPackages()
      if (response.success) {
        setPackages(response.data)
        setLoader(false)
      } else {
        setLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      setLoader(false)
      console.log(e)
      setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify, severity: 'error' })
    }
  }

  useEffect(() => {
    getPackagesList()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'ID ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'label',
      headerName: 'Package',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.label}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'active',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.active === '1' ? 'Active' : 'Inactive'}
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
            onClick={() => handleEdit(params.row.id, params.row.name, params.row.status)}
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <TableWithFilter
            TableTitle={packages.length > 0 ? 'Packages List' : 'Packages List is empty'}
            headerActions={
              <div>
                <Button size='big' variant='contained' onClick={() => addEventSidebarOpen()}>
                  Add Package
                </Button>
              </div>
            }
            columns={columns}
            rows={packages}
          />
          <AddPackages
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

export default ManufacturerList
