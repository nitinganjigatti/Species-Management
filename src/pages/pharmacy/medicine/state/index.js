import React, { useState, useEffect } from 'react'

import { getStates } from 'src/lib/api/getStates'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Drawer } from '@mui/material'
import IconButton from '@mui/material/IconButton'

import Router from 'next/router'

const ListOfStates = () => {
  const [stateList, setStateList] = useState([])
  const [loader, setLoader] = useState(false)

  const getStatesLists = async () => {
    setLoader(true)
    const response = await getStates()
    if (response?.length > 0) {
      console.log('list', response)
      response.sort((a, b) => a.id - b.id)
      setStateList(response)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const handleEdit = async (id, name, status) => {}

  useEffect(() => {
    getStatesLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'name',
      headerName: 'STATE NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'code',
      headerName: 'CODE',
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
          <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
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
            TableTitle={stateList.length > 0 ? 'State List' : 'State list is empty add State'}
            headerActions={
              <div>
                <Button size='big' variant='contained'>
                  Add State
                </Button>
              </div>
            }
            columns={columns}
            rows={stateList}
          />
        </>
      )}
    </>
  )
}

export default ListOfStates
