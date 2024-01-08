/* eslint-disable react-hooks/exhaustive-deps */
import React, { forwardRef, useState, useEffect } from 'react'

import {
  getRequestItemsListById,
  getDispatchItemsByBatchId,
  getShippedItemsByRequestId,
  markItemNotAvailable,
  markItemAvailable
} from 'src/lib/api/pharmacy/getRequestItemsList'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import Dialog from '@mui/material/Dialog'
import CustomChip from 'src/@core/components/mui/chip'
import { getDisputeItemList, getDispenseItemList } from 'src/lib/api/pharmacy/getShipmentList'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, CardContent, CardHeader } from '@mui/material'
import { useRouter } from 'next/router'

import Router from 'next/router'

import FulfillDialog from 'src/components/pharmacy/request/FulfillDialog'
import ShipRequest from 'src/components/pharmacy/request/ShipRequestForm'
import CommonDialogBox from 'src/components/CommonDialogBox'
import OrderReceiveForm from 'src/components/pharmacy/request/OrderReceiveForm'
import DisputeItemView from 'src/components/pharmacy/request/DisputeItemView'
import DispenseItemView from 'src/components/pharmacy/request/DispenseItemView'
import { ProductNotAvailable } from 'src/views/pages/pharmacy/request/dialog/productNotAvailable'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const IndividualRequest = () => {
  const [requestItems, setRequestItems] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [orderFormDialog, setOrderFormDialog] = useState(false)
  const [disputeItemDialog, setDisputeItemDialog] = useState(false)
  const [fulfillMedicine, setFulfillMedicine] = useState(false)
  const [showShipDialog, setShowShipDialog] = useState(false)
  const [dispenseDialog, setDispenseDialog] = useState(false)
  const [productNotAvailableDialog, setProductNotAvailableDialog] = useState(false)

  const [dispatchedItems, setDispatchedItems] = useState([])
  const [shippedItems, setShippedItems] = useState([])
  const [disputedItems, setDisputedItemsItems] = useState([])
  const [dispenseItems, setDispenseItems] = useState([])

  const [orderId, setOrderId] = useState('')
  const [disputeId, setDisputeId] = useState('')
  const [dispenseId, setDispenseId] = useState('')

  const [notAvailableItemId, setNotAvailableItemId] = useState({})
  const [productNotAvailableLoading, setProductNotAvailableLoading] = useState(false)

  const router = useRouter()
  const { selectedPharmacy } = usePharmacyContext()
  const { id, request_number } = router.query

  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`
  const base_image_url = '/uploads/control_substance/'

  const getRequestItemLists = async id => {
    setLoader(true)
    const response = await getRequestItemsListById(id)
    if (response.success) {
      const responseData = response.data

      const mappedWithUid = response?.data?.request_item_details?.map((item, index) => ({
        ...item,
        uid: index + 1
      }))

      responseData['request_item_details'] = mappedWithUid

      // setRequestItems(response.data)
      setRequestItems(responseData)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const getDispatchedItems = async id => {
    setLoader(true)
    const response = await getDispatchItemsByBatchId(id)
    if (response.success) {
      var responseData = response?.data

      const data = responseData?.dispatch_items?.map((el, index) => {
        const items = {
          id: index + 1,
          dispatch_id: el.dispatch_id,
          dispatch_item_id: el.dispatch_item_id,
          stock_item_id: el.stock_item_id,
          request_number: el.request_number,
          medicin_name: el.medicin_name,
          unit_price: el.unit_price,
          mrp_price: el.mrp_price,
          purchase_price: el.purchase_price,
          batch_no: el.batch_no,
          expiry_date: el.expiry_date,
          dispatch_qty: el.dispatch_qty,
          dispatch_box_qty: el.dispatch_box_qty,
          unit_id: el.unit_id,
          leaf_id: el.leaf_id,
          leaf_name: el.leaf_name,
          net_amount: el.net_amount,
          dispatch_status: el.dispatch_status,
          description: el.description,
          stock_qty: el.stock_qty,
          from_store_name: el.from_store_name,
          to_store_name: el.to_store_name,
          total_requested_qty: el.total_requested_qty,
          total_dispatch_qty: el.total_dispatch_qty
        }

        return items
      })
      var dispatches = data?.filter(item => item.dispatch_status !== 'Shipped' && item.dispatch_status !== 'PickedUp')
      responseData['dispatch_items'] = dispatches
      setDispatchedItems(responseData.dispatch_items)
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

        const mappedWithUid = response?.data?.map((item, index) => ({
          ...item,
          uid: index + 1
        }))

        setShippedItems(mappedWithUid)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (e) {
      console.log('error', e)
      setLoader(false)
    }
  }

  const getDisputeItems = async id => {
    try {
      const response = await getDisputeItemList(id)
      response?.data?.sort((a, b) => a.id - b.id)

      if (response?.success) {
        const mappedWithUid = response?.data?.map((item, index) => ({
          ...item,
          uid: index + 1
        }))

        setDisputedItemsItems(mappedWithUid)
      }
    } catch (e) {
      console.log(e)
    }
  }

  // const getDispenseItems = async id => {
  //   try {
  //     const response = await getDispenseItemList(id)

  //     if (response.success) {
  //       const mappedWithUid = response?.data?.map((item, index) => ({
  //         ...item,
  //         uid: index + 1
  //       }))

  //       setDispenseItems(mappedWithUid)
  //     } else {
  //     }
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/request/add-request/',
      query: { id: id, action: 'edit' }
    })
  }

  const onRowClick = data => {}

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

  useEffect(() => {
    if (id !== undefined && orderFormDialog === false) {
      getDisputeItems(id)

      // getDispenseItems(id)
    }
  }, [orderFormDialog])

  const closeOrderFormDialog = () => {
    setOrderFormDialog(false)
    init(id)
  }

  const showOrderFormDialog = () => {
    setOrderFormDialog(true)
  }

  const closeDisputeDialog = () => {
    setDisputeId('')
    setDisputeItemDialog(false)
  }

  const showDisputeDialog = () => {
    setDisputeItemDialog(true)
  }

  const closeDialog = () => {
    setOrderId('')
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const closeDispenseDialog = () => {
    setDispenseId('')

    setDispenseDialog(false)
  }

  const showDispenseDialog = () => {
    setDispenseDialog(true)
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
      field: 'uid',
      headerName: 'Sl',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
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

    // {
    //   flex: 0.1,
    //   minWidth: 20,
    //   field: 'priority',
    //   headerName: 'Priority',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.priority}
    //     </Typography>
    //   )
    // },

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
        <>
          {selectedPharmacy.type === 'central' && (
            <Button
              size='small'
              disabled={
                parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty) >= 1 &&
                params.row.request_status !== 'Not Available'
                  ? false
                  : true
              }
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
          )}
        </>
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
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'priority',
      headerName: '',
      renderCell: params => (
        <>
          {selectedPharmacy.type === 'central' &&
            parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty) > 0 &&
            params.row.request_status !== 'Not Available' && (
              <Button
                size='small'
                variant='contained'
                color='error'
                onClick={() => {
                  handleProductNotAvailableAction(params.row.id, false)
                }}
              >
                NOT AVAILABLE
              </Button>
            )}

          {selectedPharmacy.type === 'central' &&
            parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty) > 0 &&
            params.row.request_status === 'Not Available' && (
              <Button
                size='small'
                variant='contained'
                color='secondary'
                onClick={() => {
                  handleProductNotAvailableAction(params.row.id, true)
                }}
              >
                Make IT AVAILABLE
              </Button>
            )}
        </>
      )
    }
  ]

  const fulfillColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'Id',
      renderCell: params => (
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
          {Utility.formatDisplayDate(params.row.expiry_date)}
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
          {Utility.formatDisplayDate(dispatchedItems.dispatch_date)}
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
      field: 'uid',
      headerName: 'Sl',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
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
          {Utility.formatDisplayDate(params.row.shipment_date)}
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
          {params.row.person_shipping ? params.row.person_shipping : params.row.receiver_name}
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
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <Box sx={{ marginLeft: -6 }}>
          <IconButton
            size='small'
            onClick={() => {
              setOrderId(params.row.id)

              showOrderFormDialog()
            }}
            aria-label='Edit'
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  const disputedItemsColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'person_shipping',
      headerName: 'Person shipping',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.person_shipping ? params.row.person_shipping : params.row.receiver_name}</div>
          </Typography>
        </div>
      )
    },

    {
      flex: 0.2,
      Width: 40,
      field: 'shipment_date',
      headerName: 'Shipment Date',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{Utility.formatDisplayDate(params.row.shipment_date)}</div>
          </Typography>
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_id',
      headerName: 'Shipment Id ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipment_id}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_status',
      headerName: 'Shipment Status ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipment_status}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <Box sx={{ marginLeft: -6 }}>
          <IconButton
            size='small'
            onClick={() => {
              setDisputeId(params.row.shipping_id)

              showDisputeDialog()
            }}
            aria-label='Edit'
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  const dispenseItemsColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },

    {
      flex: 0.2,
      Width: 40,
      field: 'from_store',
      headerName: 'FROM STORE',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.from_store}</div>
          </Typography>
        </div>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipping_id',
      headerName: 'Shipping Id ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipping_id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_status',
      headerName: 'Status ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipment_status}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <Box sx={{ marginLeft: -6 }}>
          <IconButton
            size='small'
            onClick={() => {
              setDispenseId(params.row.shipment_id)

              showDispenseDialog()
            }}
            aria-label='Edit'
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  const handleRequestEdit = () => {
    Router.push({
      pathname: '/pharmacy/direct-dispatch/add-direct-dispatch/',
      query: { id: id, action: 'edit' }
    })
  }

  const handleProductNotAvailableAction = (id, available) => {
    debugger
    setNotAvailableItemId({
      id: id,
      available: available
    })
    setProductNotAvailableDialog(true)
  }

  const handleProductNotAvailable = async (status, selectedObject) => {
    if (status) {
      try {
        setProductNotAvailableLoading(true)

        const payload = {
          request_item_id: selectedObject.id
        }

        const response = selectedObject?.available
          ? await markItemAvailable(payload)
          : await markItemNotAvailable(payload)
        if (response?.success) {
          setProductNotAvailableLoading(true)
          setProductNotAvailableDialog(false)
          Router.reload()
        } else {
          setProductNotAvailableLoading(true)
        }
      } catch (e) {
        setProductNotAvailableLoading(true)
      }
    } else {
      setProductNotAvailableDialog(false)
    }
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <CommonDialogBox
            title={'Order received'}
            dialogBoxStatus={orderFormDialog}
            formComponent={
              <OrderReceiveForm
                orderId={orderId}
                requestId={id}
                disputeId={disputeId}
                closeOrderFormDialog={closeOrderFormDialog}
              />
            }
            close={closeOrderFormDialog}
            show={showOrderFormDialog}
          />
          <Card>
            <CardHeader
              title={`Direct Dispatch Request`}
              action={
                requestItems.status === 'request' || requestItems.status === 'Partial Dispatched' ? (
                  <Button
                    size='big'
                    variant='contained'
                    onClick={() => {
                      handleRequestEdit()
                    }}
                  >
                    Edit
                  </Button>
                ) : (
                  <></>
                )
              }
            />
            <CardContent>
              {/* Request Basic Info */}
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid item xs={3}>
                  <h5 style={{ marginBottom: '0px' }}>Dispatched To</h5>
                  <p>{requestItems?.to_store}</p>
                </Grid>
                <Grid item xs={3}>
                  <h5 style={{ marginBottom: '0px' }}>Dispatched By</h5>
                  <p>{requestItems?.from_store}</p>
                </Grid>
                <Grid item xs={3}>
                  <h5 style={{ marginBottom: '0px' }}>Date</h5>
                  <p>{Utility.formatDisplayDate(requestItems?.request_date)}</p>
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
            {dispatchedItems?.length > 0 ? (
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
                <TableBasic columns={fulfillColumns} rows={dispatchedItems}></TableBasic>
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
            {disputedItems?.length > 0 ? (
              <>
                <CardContent>
                  <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                    <Grid item xs={6}>
                      <h5 style={{ marginBottom: '0px' }}>Disputed Items</h5>
                    </Grid>
                  </Grid>
                </CardContent>
                <TableBasic columns={disputedItemsColumns} rows={disputedItems}></TableBasic>

                <CommonDialogBox
                  title={'Dispute Items'}
                  dialogBoxStatus={disputeItemDialog}
                  formComponent={<DisputeItemView disputeId={disputeId} />}
                  close={closeDisputeDialog}
                  show={showDisputeDialog}
                />
              </>
            ) : null}
            {/* {dispenseItems?.length > 0 ? (
              <>
                <CardContent>
                  <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                    <Grid item xs={6}>
                      <h5 style={{ marginBottom: '0px' }}>Dispense Items</h5>
                    </Grid>
                  </Grid>
                </CardContent>
                <TableBasic columns={dispenseItemsColumns} rows={dispenseItems}></TableBasic>

                <CommonDialogBox
                  title={'Dispense Items'}
                  dialogBoxStatus={dispenseDialog}
                  formComponent={<DispenseItemView dispenseId={dispenseId} />}
                  close={closeDispenseDialog}
                  show={showDispenseDialog}
                />
              </>
            ) : null} */}
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
                    <CardHeader title={`Fulfill Request`} />
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
                <ProductNotAvailable
                  open={productNotAvailableDialog}
                  onClose={handleProductNotAvailable}
                  selectedValue={notAvailableItemId}
                  loading={productNotAvailableLoading}
                />
              </Card>
            </Grid>
          </CardContent>
        </>
      )}
    </>
  )
}

export default IndividualRequest
