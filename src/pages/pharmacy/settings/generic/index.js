import React, { useState, useEffect } from 'react'

import { getGenerics, addGenericName, updateGenericName } from 'src/lib/api/pharmacy/getGenerics'
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
import { Box, Drawer } from '@mui/material'

import Router from 'next/router'
import AddGenericName from 'src/views/pages/pharmacy/medicine/generic/addGenericName'
import UserSnackbar from 'src/components/utility/snackbar'
import { AddButton } from 'src/components/Buttons'

const ListOfGenerics = () => {
  const [generics, setGenerics] = useState([])
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
        response = await updateGenericName(editParams?.id, payload)
      } else {
        console.log(JSON.stringify(payload))
        debugger
        response = await addGenericName(payload)
        debugger
        console.log(response)
      }

      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'success' })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)

        await getGenericsLists()
      } else {
        setSubmitLoader(false)
        console.log('test')
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'error' })
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

  const getGenericsLists = async () => {
    setLoader(true)
    const response = await getGenerics()
    if (response?.length > 0) {
      console.log('list', response)

      let listWithId = response
        ? response.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
        : []

      // response.sort((a, b) => a.id - b.id)
      setGenerics(listWithId)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    getGenericsLists()
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
      field: 'name',
      headerName: 'GENERIC NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.name}
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
            aria-label='Edit'
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
            TableTitle={generics.length > 0 ? 'Generic List' : 'Generic list is empty add generics'}
            headerActions={
              <div>
                <AddButton title='Add Generic' action={() => addEventSidebarOpen()} />
              </div>
            }
            columns={columns}
            rows={generics}
          />
          <AddGenericName
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

export default ListOfGenerics
