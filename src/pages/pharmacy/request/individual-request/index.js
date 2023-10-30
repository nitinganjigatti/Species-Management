import React, { useState, useEffect } from 'react'

import { getRequestItemsListById } from 'src/lib/api/getRequestItemsList'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import DataGrid from 'src/@core/theme/overrides/dataGrid'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, CardContent, CardHeader } from '@mui/material'
import { useRouter } from 'next/router'

import Router from 'next/router'
import { column } from 'stylis'

import FulfillDialog from 'src/components/pharmacy/request/FulfillDialog'

const IndividualRequest = () => {
  const [requestItems, setRequestItems] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [fulfillMedicine, setFulfillMedicine] = useState(false)

  const router = useRouter()
  const { id, request_number } = router.query

  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`

  console.log('base_url', base_url)

  console.log('id', id)

  const getRequestItemLists = async id => {
    setLoader(true)
    console.log('getRequestItemList', id)
    const response = await getRequestItemsListById(id)
    debugger
    if (response.success) {
      debugger
      setRequestItems(response.data)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/request/addRequest/',
      query: { id: id, action: 'edit' }
    })
  }

  const onRowClick = data => {
    console.log('onRowClickData', data)
  }

  useEffect(() => {
    if (id !== undefined) {
      getRequestItemLists(id)
    }
  }, [id])

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const rows = [
    {
      id: 1,
      name: 'Crocin',
      controlledSubstance: true,
      requested_qty: 5,
      priority: 'High',
      fulfilled: 3,
      remaining: 2,
      attachment: ''
    },
    {
      id: 2,
      name: 'Ecosprin',
      controlledSubstance: false,
      requested_qty: 5,
      priority: 'Normal',
      fulfilled: 3,
      remaining: 2,
      attachment: ''
    }
  ]

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'Id',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'stock_name',
      headerName: 'Medicine Name',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'requested_qty',
      headerName: 'Requested QTY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.requested_qty}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'priority',
      headerName: 'Priority',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.priority}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: '',
      headerName: 'Action',
      renderCell: params => (
        <Button
          size='small'
          variant='contained'
          onClick={() => {
            setFulfillMedicine({
              ...params.row
            })
            showDialog()
          }}
        >
          Fulfill
        </Button>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'dispatch_qty',
      headerName: 'Fulfilled',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.dispatch_qty}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'remaining',
      headerName: 'Remaining',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'attachment',
      headerName: 'Attachment',
      renderCell: params => (
        <img
          src='https://pharmacaredemo.bdtask-demo.com/pharmacare-9.4_demo/assets/dist/img/products/product.png'
          alt='Medicine Image'
          style={{ width: '60px', height: '60px' }}
        />
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
          <Card>
            <CardHeader title={`Request - ${request_number}`} />
            <CardContent>
              {/* Request Basic Info */}
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid item xs={3}>
                  <h5 style={{ marginBottom: '0px' }}>Requested By</h5>
                  <p>{requestItems?.from_store}</p>
                </Grid>
                <Grid item xs={3}>
                  <h5 style={{ marginBottom: '0px' }}>Requested To</h5>
                  <p>{requestItems?.to_store}</p>
                </Grid>
                <Grid item xs={3}>
                  <h5 style={{ marginBottom: '0px' }}>Date</h5>
                  <p>{requestItems?.request_date}</p>
                </Grid>
                <Grid item xs={3}>
                  <h5 style={{ marginBottom: '0px' }}>Request ID</h5>
                  <p>{requestItems?.request_number}</p>
                </Grid>
              </Grid>
              {/* Medicine Listing */}
            </CardContent>
            {requestItems?.request_item_details?.length > 0 ? (
              <TableBasic columns={columns} rows={requestItems?.request_item_details}></TableBasic>
            ) : null}
            <CardContent>
              <Grid container>
                <FulfillDialog
                  fulfillMedicine={fulfillMedicine}
                  title={'Fulfill'}
                  dialogBoxStatus={show}
                  close={closeDialog}
                  show={showDialog}
                />
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}

export default IndividualRequest
