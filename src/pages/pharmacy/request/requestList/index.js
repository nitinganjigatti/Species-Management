import React, { useState, useEffect } from 'react'

import { getRequestItemsList } from 'src/lib/api/getRequestItemsList'
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

const Dispatch = () => {
  const [requestItems, setRequestItems] = useState([])
  const [loader, setLoader] = useState(false)

  const getRequestItemLists = async () => {
    setLoader(true)
    const response = await getRequestItemsList()
    if (response?.length > 0) {
      console.log('list', response)

      // response.sort((a, b) => a.id - b.id)
      let listWithId = response
        ? response.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
        : []
      setRequestItems(listWithId)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    getRequestItemLists()
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
      field: 'request_number',
      headerName: 'REQUEST ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.request_number}
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
      field: 'request_date',
      headerName: 'DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.request_date}
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
          {params.row.status === 'Fully Dispatched' ? (
            <IconButton size='small' sx={{ mr: 0.5 }}>
              <Icon icon='mdi:package-delivered' />
            </IconButton>
          ) : params.row.status === 'Partial Dispatched' ? (
            <>
              <IconButton size='small' sx={{ mr: 0.5 }}>
                <Icon icon='fluent-mdl2:message-friend-request' />
              </IconButton>
              <IconButton size='small' sx={{ mr: 0.5 }}>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton size='small' sx={{ mr: 0.5 }}>
                <Icon icon='fluent-mdl2:message-friend-request' />
              </IconButton>
              <IconButton size='small' sx={{ mr: 0.5 }}>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </>
          )}
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
          TableTitle={requestItems.length > 0 ? 'Request List' : 'Request List is empty add Request List'}
          headerActions={
            <div>
              <Button
                size='big'
                variant='contained'
                onClick={() => {
                  Router.push('/pharmacy/request/addRequest/')
                }}
              >
                Add Request
              </Button>
            </div>
          }
          columns={columns}
          rows={requestItems}
        />
      )}
    </>
  )
}

export default Dispatch
