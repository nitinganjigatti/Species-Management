import React, { useState, useEffect } from 'react'

// import { getAllocation } from 'src/lib/api/getAllocation'
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

const Allocation = () => {
  const [allocation, setAllocation] = useState([])
  const [loader, setLoader] = useState(false)

  const getAllocationsLists = async () => {
    // setLoader(true)
    // const response = await getAllocation()
    // if (response?.length > 0) {
    //   console.log('list', response)
    //   let a = response.map((el, i) => {
    //     return { ...el, uid: i + 1 }
    //   })
    //   // response.sort((a, b) => a.id - b.id)
    //   setAllocation(a)
    //   setLoader(false)
    // } else {
    //   setLoader(false)
    // }
  }

  useEffect(() => {
    getAllocationsLists()
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
      headerName: 'DISPATCH DATE',
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
      field: 'total_box_qty',
      headerName: 'TOTAL BOXES',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_box_qty}
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
            onClick={() => {
              console.log(params.row.id)
            }}
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          {params.row.status === 'dispatch' ? (
            <IconButton size='small' sx={{ mr: 0.5 }}>
              <Icon icon='carbon:delivery' />
            </IconButton>
          ) : null}
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
          TableTitle={allocation.length > 0 ? 'Allocation List' : 'Allocation List is empty add Allocation List'}
          headerActions={
            <div>
              <Button size='big' variant='contained'>
                Add Allocation
              </Button>
            </div>
          }
          columns={columns}
          rows={allocation}
        />
      )}
    </>
  )
}

export default Allocation
