import React, { forwardRef, useState, useEffect } from 'react'

import {
  getRequestItemsListById,
  getDispatchItemsByBatchId,
  getShippedItemsByRequestId
} from 'src/lib/api/getRequestItemsList'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import DataGrid from 'src/@core/theme/overrides/dataGrid'
import Dialog from '@mui/material/Dialog'
import CustomChip from 'src/@core/components/mui/chip'

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
import Fade from '@mui/material/Fade'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, CardContent, CardHeader } from '@mui/material'
import { useRouter } from 'next/router'

import Router from 'next/router'
import { column } from 'stylis'

import FulfillDialog from 'src/components/pharmacy/request/FulfillDialog'
import ShipRequest from 'src/components/pharmacy/request/ShipRequestForm'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const IndividualRequest = () => {
  const [requestItems, setRequestItems] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [fulfillMedicine, setFulfillMedicine] = useState(false)
  const [showShipDialog, setShowShipDialog] = useState(false)
  const [dispatchedItems, setDispatchedItems] = useState([])
  const [shippedItems, setShippedItems] = useState([])

  const router = useRouter()
  const { id, request_number } = router.query

  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`
  const base_image_url = '/uploads/control_substance/'

  console.log('base_url', base_url)

  console.log('id', id)

  const getRequestItemLists = async id => {
    setLoader(true)
    console.log('getRequestItemList', id)
    const response = await getRequestItemsListById(id)
    if (response.success) {
      setRequestItems(response.data)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const getDispatchedItems = async id => {
    setLoader(true)
    const response = await getDispatchItemsByBatchId(id)
    if (response.success) {
      var responseData = response.data
      var dispatches = response?.data?.dispatch_items.filter(item => item.dispatch_status !== 'Shipped')
      responseData['dispatch_items'] = dispatches
      console.log(dispatches)
      setDispatchedItems(responseData)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const getShippedItems = async id => {
    // debugger
    try {
      setLoader(true)
      const response = await getShippedItemsByRequestId(id)

      if (response.success) {
        // debugger
        setShippedItems(response.data)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (e) {
      console.log(e)
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

  const init = async id => {
    if (id !== undefined) {
      await getRequestItemLists(id)
      await getDispatchedItems(id)
      await getShippedItems(id)
    }
  }

  useEffect(() => {
    if (id !== undefined) {
      init(id)
    }
  }, [id])

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const openShipDialog = () => {
    setShowShipDialog(true)
  }

  const closeShipDialog = () => {
    setShowShipDialog(false)
  }

  const closeShipmentDialog = () => {
    setShowShipDialog(false)
    init(id)
  }

  const closeFulfillDialog = () => {
    setShow(false)
    init(id)
  }

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
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.stock_name}
          </Typography>
          {!isNaN(params.row.control_substance) && parseInt(params.row.control_substance) == 1 ? (
            <CustomChip label='CS' skin='light' color='success' size='small' />
          ) : null}
        </div>
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
      field: '',
      headerName: 'Action',
      renderCell: params => (
        <Button
          size='small'
          disabled={parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty) >= 1 ? false : true}
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
      field: 'attachment',
      headerName: 'Attachment',
      renderCell: params =>
        !isNaN(params?.row?.control_substance) && parseInt(params?.row?.control_substance) === 1 ? (
          <img
            src={`${base_url}${base_image_url}${params?.row?.control_substance_file}`}
            alt='Medicine Image'
            style={{ width: '60px', height: '60px' }}
          />
        ) : null
    }
  ]

  const fulfillColumns = [
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
      field: 'medicin_name',
      headerName: 'Medicine Name',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.medicin_name}</div>
          </Typography>
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'batch_no',
      headerName: 'Batch No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'expiry_date',
      headerName: 'Expiry Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.expiry_date}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'fulfilledDate',
      headerName: 'Fulfilled Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {dispatchedItems.dispatch_date}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'dispatch_qty',
      headerName: 'Fulfilled QTY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.dispatch_qty}
        </Typography>
      )
    }
  ]

  const shippedColumns = [
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
      field: 'shipment_id',
      headerName: 'Shipment Id',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.shipment_id}</div>
          </Typography>
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_date',
      headerName: 'Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipment_date}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'from_store_name',
      headerName: 'From Store',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.from_store_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'to_store_name',
      headerName: 'To Store',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.to_store_name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'vehicle_no',
      headerName: 'Vehicle No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.vehicle_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'person_shipping',
      headerName: 'Person Shipping',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.person_shipping}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipment_status}
        </Typography>
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
            {/* Dispatch list */}
            {dispatchedItems?.dispatch_items?.length > 0 ? (
              <>
                <CardContent>
                  <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                    <Grid item xs={6}>
                      <h5 style={{ marginBottom: '0px' }}>Fulfillment</h5>
                    </Grid>
                    <Grid item xs={6} style={{ display: 'flex', justifyContent: 'right' }}>
                      <Button
                        size='big'
                        variant='contained'
                        onClick={() => {
                          openShipDialog()
                        }}
                      >
                        Ship
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
                <TableBasic columns={fulfillColumns} rows={dispatchedItems?.dispatch_items}></TableBasic>
              </>
            ) : null}

            {/* Shipped list        */}
            {shippedItems?.length > 0 ? (
              <>
                <CardContent>
                  <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                    <Grid item xs={6}>
                      <h5 style={{ marginBottom: '0px' }}>Shipped Items</h5>
                    </Grid>
                  </Grid>
                </CardContent>
                <TableBasic columns={shippedColumns} rows={shippedItems}></TableBasic>
              </>
            ) : null}
          </Card>
          {/* Fulfill Request Dialog */}
          <CardContent>
            <Grid container>
              <Card>
                <Dialog
                  fullWidth
                  open={show}
                  maxWidth='md'
                  scroll='body'
                  onClose={() => closeDialog()}
                  TransitionComponent={Transition}
                  onBackdropClick={() => closeDialog()}
                >
                  <Grid
                    container
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <CardHeader title={`Fulfill - ${fulfillMedicine.id}`} />
                    <IconButton size='small' onClick={() => closeDialog()} sx={{ mx: 4 }}>
                      <Icon icon='mdi:close' />
                    </IconButton>
                  </Grid>

                  <FulfillDialog
                    fulfillMedicine={fulfillMedicine}
                    storeDetails={requestItems}
                    close={closeFulfillDialog}
                  />
                </Dialog>
              </Card>
            </Grid>
          </CardContent>
          {/* Ship Request Dialog */}
          <CardContent>
            <Grid container>
              <Card>
                <Dialog
                  fullWidth
                  open={showShipDialog}
                  maxWidth='md'
                  scroll='body'
                  onClose={() => closeShipDialog()}
                  TransitionComponent={Transition}
                  onBackdropClick={() => closeShipDialog()}
                >
                  <Grid
                    container
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <CardHeader title={`Shipment`} />
                    <IconButton size='small' onClick={() => closeShipDialog()} sx={{ mx: 4 }}>
                      <Icon icon='mdi:close' />
                    </IconButton>
                  </Grid>

                  <ShipRequest
                    dispatchedItems={dispatchedItems}
                    storeDetails={requestItems}
                    close={closeShipmentDialog}
                  />
                </Dialog>
              </Card>
            </Grid>
          </CardContent>
        </>
      )}
    </>
  )
}

export default IndividualRequest
