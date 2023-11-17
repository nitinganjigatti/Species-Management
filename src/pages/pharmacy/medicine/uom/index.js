import React, { useState, useEffect } from 'react'

import { getUnits, addUnits, updateUnits } from 'src/lib/api/getUnits'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Drawer } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import UserSnackbar from 'src/components/utility/snackbar'

import Router from 'next/router'
import AddUOM from 'src/views/pages/pharmacy/medicine/uom/addUom'

const ListOfUOM = () => {
  const [uomList, setUomList] = useState([])
  const [loader, setLoader] = useState(false)

  /*** Drawer ****/
  const editParamsInitialState = { id: null, name: null, status: null, code: null, short_code: null }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: '',
    status: false
  })

  const addEventSidebarOpen = () => {
    console.log('event clicked')
    setEditParams({ id: null, name: null, status: null })
    setResetForm(true)
    console.log('edit', editParams)
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
        response = await updateUnits(editParams?.id, payload)
      } else {
        response = await addUnits(payload)
      }
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success', status: true })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        await getUOMLists()
      } else {
        setSubmitLoader(false)
        console.log('test')
        setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify(response?.message), severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify(e), severity: 'error' })
    }
  }

  const handleEdit = async (id, name, status) => {
    console.log('in state file', id, name, status)
    setEditParams({ id: id, name: name, status: status })
    setOpenDrawer(true)
  }

  /***** Drawer  */

  const getUOMLists = async () => {
    try {
      setLoader(true)
      const response = await getUnits()
      if (response.success) {
        setUomList(response.data)
        setLoader(false)
      } else {
        setLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify(response?.message), severity: 'error' })
      }
    } catch (e) {
      setLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify(e), severity: 'error' })
    }
  }

  useEffect(() => {
    getUOMLists()
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
      field: 'unit_name',
      headerName: 'UOM NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.unit_name}
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
            aria-label='Edit'
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
          />
          <AddUOM
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

export default ListOfUOM
