import React, { useState, useEffect } from 'react'

import { getDispatchValidation } from 'src/lib/api/pharmacy/getDispatchValidation'
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

const DispatchValidationList = () => {
  const [dispatches, setDispatches] = useState([])
  const [loader, setLoader] = useState(false)

  const getDispatchLists = async () => {
    setLoader(true)
    const response = await getDispatchValidation()
    if (response?.length > 0) {
      console.log('list', response)

      let listWithId = response.map((el, i) => {
        return { ...el, uid: i + 1 }
      })
      setDispatches(listWithId)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    getDispatchLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'dispatch_number',
      headerName: 'DISPATCH ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.dispatch_number}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'dispatch_date',
      headerName: 'D-VALIDATION DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.dispatch_date}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'from_store',
      headerName: 'FROM STORE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.from_store}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'to_store',
      headerName: 'TO STORE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.to_store}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_dispatch_box_qty',
      headerName: 'TOTAL BOXES QTY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_dispatch_box_qty}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_received_box_qty',
      headerName: 'TOTAL RECEIVED BOXES QTY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_received_box_qty}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_qty',
      headerName: 'TOTAL QTY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_qty}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_received_qty',
      headerName: 'TOTAL RECEIVED QTY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_received_qty}
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
          <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
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
        <TableWithFilter
          TableTitle={
            dispatches.length > 0
              ? 'Dispatch Validation List'
              : 'Dispatch Validation List is empty add Dispatch Validation List'
          }
          headerActions={
            <div>
              <Button size='big' variant='contained'>
                Add Validation
              </Button>
            </div>
          }
          columns={columns}
          rows={dispatches}
        />
      )}
    </>
  )
}

export default DispatchValidationList
