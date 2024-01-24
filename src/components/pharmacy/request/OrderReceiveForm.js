/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect } from 'react'
import TableBasic from 'src/views/table/data-grid/TableBasic'

import { Grid, FormControl, Select, MenuItem, TextField, Divider, Box, Button, IconButton } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import FormHelperText from '@mui/material/FormHelperText'
import Icon from 'src/@core/components/icon'
import CircularProgress from '@mui/material/CircularProgress'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import toast from 'react-hot-toast'

import {
  getShipmentOrderDetails,
  getShipmentStatusList,
  resolveDisputeItems
} from 'src/lib/api/pharmacy/getShipmentList'

import { updateShipmentRequest } from 'src/lib/api/pharmacy/getRequestItemsList'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import FallbackSpinner from 'src/@core/components/spinner'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

function OrderReceiveForm({ orderId, requestId, closeOrderFormDialog }) {
  const defaultValues = {
    shipment_id: '',
    // dispatch_id: '',
    request_id: requestId,
    comments: '',
    store_id: '',
    item_details: [
      {
        dispatch_id: '',
        uid: '',
        id: '',
        stock_id: '',
        stock_name: '',
        count: '',
        batch_no: '',
        from_store: '',
        to_store: '',
        from_store_name: '',
        to_store_name: '',
        status: '',
        wrong_count_type: '',
        wrong_count_number: ''
      }
    ]
  }

  const [disputeItemDetails, setDisputeItemDetails] = useState({})
  const [tempDisputeItemDetails, setTempDisputeItemDetails] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [statusOptions, setStatusOptions] = useState([])
  const [resolveLoader, setResolveLoader] = useState(false)

  const [orderData, setOrderData] = useState([])
  const { selectedPharmacy } = usePharmacyContext()

  const handleStatusChange = (itemId, event) => {
    const { name, value } = event.target

    const updatedData = {
      ...disputeItemDetails,
      item_details: disputeItemDetails.item_details.map(item =>
        // item.id === itemId ? { ...item, status: event.target.value } : item
        item.id === itemId ? { ...item, [name]: value } : item
      )
    }
    console.log('updatedData', updatedData)
    setDisputeItemDetails(updatedData)
  }

  const clearStatus = (itemId, event) => {
    console.log('event', event)

    const updatedData = {
      ...disputeItemDetails,
      item_details: disputeItemDetails.item_details.map(item =>
        item.id === itemId ? { ...item, status: '', wrong_count_type: '', wrong_count_number: '' } : item
      )
    }
    // debugger
    console.log('updatedData', updatedData)
    setDisputeItemDetails(updatedData)
  }

  // const options = ['Received', 'Broken', 'Missing', 'Wrong count', 'Expired']

  const getStatusList = async () => {
    try {
      const status = await getShipmentStatusList()
      // console.log('status', status)
      if (status?.success) {
        setStatusOptions(status?.data)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const getOrderDetails = async orderId => {
    try {
      const response = await getShipmentOrderDetails(orderId)

      console.log('getOrderDetails', response)
      debugger

      if (response?.success === true && response?.data !== '') {
        const disputeLineItems = response?.data?.shipment_item_details?.map((el, index) => {
          const data = {
            uid: index + 1,
            id: el?.id,
            stock_id: el?.stock_id,
            batch_no: el?.batch,
            count: el?.quantity,
            from_store: el?.from_store,
            to_store: el?.to_store,
            stock_name: el?.stock_name,
            from_store_name: el?.from_store_name,
            to_store_name: el?.to_store_name,
            status: el.status ? el.status : '',
            dispatch_id: el?.dispatch_id,
            dispatch_item_id: el?.dispatch_item_id,
            wrong_count_type: el?.wrong_count_type ? el?.wrong_count_type : '',
            wrong_count_number: el?.wrong_count_number ? el?.wrong_count_number : '',
            dispute_status: el?.dispute_status ? el?.dispute_status : '',
            request_item_id: el?.request_item_id ? el?.request_item_id : ''
          }

          return data
        })
        setOrderData({
          ...orderData,

          shipping_id: orderId,
          shipment_id: response?.data?.shipment_id,
          shipment_date: response?.data?.shipment_date,
          person_shipping: response?.data?.person_shipping,
          shipment_status: response?.data?.shipment_status,
          vehicle_no: response?.data?.vehicle_no,
          item_details: disputeLineItems
        })
        // debugger
        console.log('orderData', orderData)
        console.log('response delevery statsu', response.data?.delivery_status)

        const disputesData = {
          shipment_id: orderId,
          store_id: response?.data?.shipment_item_details[0]?.from_store,
          // dispatch_id: response?.data?.dispatch_id,
          request_id: requestId,
          item_details: disputeLineItems,
          comments: response?.data?.comments,
          delivery_status: response?.data?.delivery_status
        }

        setDisputeItemDetails(disputesData)
        setTempDisputeItemDetails(disputesData)
        debugger
      } else {
        debugger
      }
    } catch (error) {
      console.log(disputeItemDetails)
      debugger
      console.log('error', error)
    }
  }

  function getDisableStatus(id) {
    if (!Array.isArray(orderData.item_details)) {
      return
    }
    const foundItem = orderData.item_details?.find(item => item.id == id)
    if (foundItem.status !== '') {
      return true
    } else {
      return false
    }
  }
  function disableButton() {
    if (disputeItemDetails?.item_details) {
      const allReceived = disputeItemDetails?.item_details.every(item => item.status === '')

      return allReceived
    }
  }
  useEffect(() => {
    if (orderId) {
      getOrderDetails(orderId)
    }
    getStatusList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bulkStatusUpdate = async () => {
    const updatedItemDetails = disputeItemDetails.item_details.map(item => {
      // if (item.status === '' || item.status === 'Expired' || item.status === 'Broken') {
      //   return {
      //     ...item,
      //     status: 'Received'
      //   }
      // } else {
      //   return item
      // }

      return {
        ...item,
        status: 'Received'
      }
    })

    // setDisputeItemDetails(prevState => ({
    //   ...prevState,
    //   item_details: updatedItemDetails
    // }))
    const items = disputeItemDetails
    items['item_details'] = updatedItemDetails
    setDisputeItemDetails({ ...disputeItemDetails, items })
    console.log('after update', disputeItemDetails)
    // debugger
    updateStatus()
  }

  const resolveItems = async payload => {
    // debugger
    var itemsToResolve
    console.log('line data', payload)
    if (payload?.status === 'Missing') {
      itemsToResolve = {
        from_store: payload.from_store,
        to_store: payload.to_store,
        batch_no: payload.batch_no,
        stock_id: payload.stock_id,
        status: payload.status,
        dispatch_item_id: payload.dispatch_item_id,
        request_id: requestId,
        request_item_id: payload.request_item_id,
        type: 'resolve',
        action: 'accept'
      }
    }
    if (payload?.status === 'Wrong Count' && payload.wrong_count_type === 'excess') {
      itemsToResolve = {
        from_store: payload.from_store,
        to_store: payload.to_store,
        batch_no: payload.batch_no,
        stock_id: payload.stock_id,
        status: payload.status,
        dispatch_item_id: payload.dispatch_item_id,
        excess_count: payload.wrong_count_number,
        request_id: requestId,
        request_item_id: payload.request_item_id,
        type: 'Excess',
        action: 'accept'
      }
    }

    if (payload?.status === 'Wrong Count' && payload.wrong_count_type === 'shortage') {
      itemsToResolve = {
        from_store: payload.from_store,
        to_store: payload.to_store,
        batch_no: payload.batch_no,
        stock_id: payload.stock_id,
        status: payload.status,
        dispatch_item_id: payload.dispatch_item_id,
        shortage_count: payload.wrong_count_number,
        type: 'Shortage',
        action: 'accept',
        request_id: requestId,
        request_item_id: payload.request_item_id
      }
    }

    console.log('payload', itemsToResolve)
    // debugger
    try {
      setResolveLoader(true)
      const resolved = await resolveDisputeItems(itemsToResolve)
      // debugger
      if (resolved?.success) {
        setResolveLoader(false)
        toast.success(resolved?.data)
        getOrderDetails(orderId)
      } else {
        setResolveLoader(false)
      }

      console.log('resolve response ', resolved)
    } catch (error) {
      setResolveLoader(false)

      console.log('error', error)
    }
  }

  const verifyStatusInTemp = id => {
    const verified = disputeItemDetails?.item_details?.find(el => el.id === id)
    const verifyInTempData = tempDisputeItemDetails?.item_details?.find(el => el.id === verified?.id)
    const result = verified?.status === verifyInTempData?.status

    return result
  }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'stock_name',
      headerName: 'Product Name',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.stock_name}
          </Typography>
        </div>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'batch_no',
      headerName: 'Batch',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'count',
      headerName: 'qty',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.count}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'from_store_name',
      headerName: selectedPharmacy?.type === 'central' ? 'Shipped To' : 'Shipped From',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {selectedPharmacy?.type === 'central' ? params.row.to_store_name : params.row.from_store_name}
        </Typography>
      )
    },
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'to_store_name',
    //   headerName: 'Shipped To',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.to_store_name}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.4,
      minWidth: 200,
      field: 'status',
      // headerName: 'Status',
      headerName: selectedPharmacy?.type === 'central' ? 'Actions' : 'Status',
      renderCell: params => {
        return (
          <>
            {selectedPharmacy.type === 'central' ? (
              <>
                <Grid
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textTransform: 'capitalize'
                  }}
                >
                  <Typography variant='p' sx={{ mx: 2 }}>
                    {/* {params.row.status === 'Wrong Count' && params?.row?.dispute_status === 'Dispute Pending' ? */}
                    {params.row.status === 'Wrong Count' ||
                    params.row.status === 'Shortage - Accepted' ||
                    params.row.status === 'Excess - Accepted'
                      ? `${params?.row?.wrong_count_type} (${params?.row?.wrong_count_number}) ${
                          params?.row?.dispute_status === 'Dispute Resolved' ? '- Accepted' : ''
                        }`
                      : params.row.status}
                    {/* : params.row.status} */}
                  </Typography>
                  {params?.row?.dispute_status === 'Not Resolved' ||
                  params?.row?.dispute_status === 'Dispute Pending' ? (
                    <>
                      {resolveLoader ? (
                        <CircularProgress size={40} />
                      ) : (
                        <IconButton
                          size='large'
                          aria-label='Accept'
                          onClick={() => {
                            resolveItems(params.row)
                          }}
                          sx={{ padding: 0 }}
                          color='success'
                        >
                          <Icon icon='ion:checkmark-circle' sx={{ width: '40px', height: '40px' }} />
                        </IconButton>
                      )}

                      <IconButton aria-label='Deny' sx={{ padding: 0 }} size='large' color='error'>
                        <Icon icon='ion:close-circle' />
                      </IconButton>

                      {/* <IconButton aria-label='Deny' size='small' color='error' variant='contained'></IconButton> */}
                      {/* <LoadingButton
                        size='small'
                        onClick={() => {
                          resolveItems(params.row)
                        }}
                        variant='contained'
                        loading={resolveLoader}
                        startIcon={<Icon icon={'ion:checkmark-circle'}></Icon>}
                      >
                        Accept
                      </LoadingButton>

                      <LoadingButton size='small' color='error' variant='contained'>
                        Deny
                      </LoadingButton> */}
                    </>
                  ) : null}
                </Grid>
              </>
            ) : (
              <>
                {params.row.status === 'Wrong Count' &&
                (params?.row?.dispute_status === '' ||
                  params?.row?.dispute_status === undefined ||
                  params?.row?.dispute_status === 'Not Resolved' ||
                  params?.row?.dispute_status === 'Dispute Pending') ? (
                  <Grid container spacing={2}>
                    <Grid item xs={5} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FormControl size='small' style={{ width: '100%' }}>
                        <Select
                          label=''
                          // disabled={getDisableStatus(params.row.id)}
                          name='wrong_count_type'
                          size='small'
                          style={{ fontSize: '12px' }}
                          value={params?.row?.wrong_count_type}
                          error={Boolean(params?.row?.wrong_count_type === '' ? `This field is required` : '')}
                          onChange={event => handleStatusChange(params.row.id, event)}
                        >
                          <MenuItem value='shortage' style={{ fontSize: '12px' }}>
                            Shortage
                          </MenuItem>
                          <MenuItem value='excess' style={{ fontSize: '12px' }}>
                            Excess
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid
                      item
                      xs={5}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                    >
                      <TextField
                        // disabled={getDisableStatus(params.row.id)}
                        id='outlined-size-small'
                        name='wrong_count_number'
                        value={params?.row?.wrong_count_number}
                        error={Boolean(params?.row?.wrong_count_number === '' ? `This field is required` : '')}
                        size='small'
                        onChange={event => handleStatusChange(params.row.id, event)}
                        inputProps={{ style: { fontSize: 12 } }}
                      />
                    </Grid>
                    <Grid item xs={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Button
                        sx={{ width: 2, maxWidth: 2 }}
                        // disabled={disableButton()}
                        onClick={event => {
                          clearStatus(params.row.id, event)
                        }}
                      >
                        <Icon
                          // type='button'
                          // disabled={disableButton()}
                          // onClick={event => {
                          //   clearStatus(params.row.id, event)
                          // }}
                          icon='material-symbols-light:close'
                        />
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container>
                    {(params.row.status === 'Missing' ||
                      params.row.status === 'Wrong Count' ||
                      verifyStatusInTemp(params.row.id) === false ||
                      params.row.status === '') &&
                    (params?.row?.dispute_status === 'Not Resolved' ||
                      params?.row?.dispute_status === '' ||
                      params?.row?.dispute_status === undefined ||
                      params?.row?.dispute_status === 'Dispute Pending') ? (
                      <Grid xs={12} sm={12}>
                        <FormControl fullWidth size='small'>
                          <Select
                            // disabled={getDisableStatus(params.row.id)}
                            fullWidth
                            placeholder='Status'
                            name='status'
                            size='small'
                            error={Boolean(params?.row?.status === '' ? `This field is required` : '')}
                            value={params?.row?.status}
                            onChange={event => handleStatusChange(params.row.id, event)}
                          >
                            {statusOptions?.map((item, index) => (
                              <MenuItem key={index} value={item?.label}>
                                {item?.label === 'Broken' || item?.label === 'Expired'
                                  ? `Received (${item?.label})`
                                  : item?.label === 'Missing'
                                  ? `Dispute (${item?.label})`
                                  : item?.label === 'Wrong Count'
                                  ? `Dispute (Wrong Qty)`
                                  : item?.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    ) : (
                      <Typography variant='p' sx={{ mx: 2 }}>
                        {/* {params.row.status} */}
                        {params.row.status === 'Wrong Count' ||
                        params.row.status === 'Shortage - Accepted' ||
                        params.row.status === 'Excess - Accepted'
                          ? `${params?.row?.wrong_count_type} (${params?.row?.wrong_count_number}) ${
                              params?.row?.dispute_status === 'Dispute Resolved' ? '- Accepted' : ''
                            }`
                          : params.row.status}
                      </Typography>
                    )}
                  </Grid>
                )}
              </>
            )}
          </>
        )
      }
    }
  ]

  async function updateStatus() {
    const isStatusEmpty = disputeItemDetails?.item_details?.some(item => item.status.trim() === '')

    if (isStatusEmpty) {
      console.error('Please fill in all status fields.')

      return
    }
    const receivedItems = disputeItemDetails?.item_details

    console.log('receivedItems: ', receivedItems)
    console.log('disputeItemDetails3: ', disputeItemDetails)

    if (receivedItems.length > 0) {
      const finalReceivedItems = receivedItems.map((item, index) => {
        return {
          ...item,
          from_store_id: item.from_store,
          to_store_id: item.to_store,
          shipment_item_id: item.id,
          shipment_date: orderData.shipment_date,
          person_shipping: orderData.person_shipping,
          status: orderData.shipment_status,
          vehicle_no: orderData.vehicle_no,
          picked_up: orderData.picked_up,
          request_id: requestId,
          comments: disputeItemDetails.comments,
          item_status: item.status
        }
      })

      const verifyCount = finalReceivedItems.some(el => {
        if (el.item_status === 'Wrong Count') {
          if (el.wrong_count_number === '' || el.wrong_count_type === '') {
            return false
          }
        }

        return true
      })
      console.log('verifyCount', verifyCount)
      if (verifyCount) {
        try {
          const result = await updateShipmentRequest(orderId, finalReceivedItems)

          if (result?.success) {
            toast.success(result?.msg)
            setSubmitLoader(false)
            closeOrderFormDialog()
          }
        } catch (error) {
          setSubmitLoader(false)

          toast.error(error?.msg)
        }
      }
    }
  }

  return (
    <>
      {disputeItemDetails?.item_details?.length > 0 ? (
        <Grid container xs={12} sx={{ mx: 'auto' }}>
          <Grid item xs={12}>
            <Grid container xs={12}>
              {orderData?.shipment_id ? (
                <Grid item md={3} sm={3} xs={6}>
                  <h5 style={{ marginBottom: '0px' }}>Shipping id</h5>
                  <p>{orderData.shipment_id}</p>
                </Grid>
              ) : null}
              {orderData?.from_store_name ? (
                <Grid item md={3} sm={3} xs={6}>
                  <h5 style={{ marginBottom: '0px' }}>From Store </h5>
                  <p>{orderData.from_store_name}</p>
                </Grid>
              ) : null}
              {orderData?.shipment_date ? (
                <Grid item md={3} sm={3} xs={6}>
                  <h5 style={{ marginBottom: '0px' }}>Shipped Date</h5>
                  <p>{Utility.formatDisplayDate(orderData.shipment_date)}</p>
                </Grid>
              ) : null}
              {orderData?.vehicle_no ? (
                <Grid item md={3} sm={3} xs={6}>
                  <h5 style={{ marginBottom: '0px' }}>Vehicle Number</h5>
                  <p>{orderData.vehicle_no}</p>
                </Grid>
              ) : null}
              {orderData?.to_store_name ? (
                <Grid item md={3} sm={3} xs={6}>
                  <h5 style={{ marginBottom: '0px' }}>To Store </h5>
                  <p>{orderData.to_store_name}</p>
                </Grid>
              ) : null}

              {orderData?.person_shipping ? (
                <Grid item md={3} sm={3} xs={6}>
                  <h5 style={{ marginBottom: '0px' }}>Driver details</h5>
                  <p>{orderData.person_shipping}</p>
                </Grid>
              ) : null}
            </Grid>

            {disputeItemDetails?.item_details?.length > 0 ? (
              <>
                <Divider
                  sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
                />
                <Grid md={12} sm={12} xs={12} sx={{ my: 2 }}>
                  <TableBasic columns={columns} rows={disputeItemDetails?.item_details}></TableBasic>
                </Grid>
              </>
            ) : null}

            <Grid container items>
              <Grid item md={12} sm={12} xs={12} sx={{ my: 6 }}>
                <FormControl fullWidth>
                  <TextField
                    // disabled={disableButton()}
                    disabled={selectedPharmacy.type === 'central' ? 'disabled' : null}
                    multiline
                    rows={3}
                    type='text'
                    label='Comment'
                    value={disputeItemDetails?.comments}
                    onChange={e => {
                      setDisputeItemDetails({ ...disputeItemDetails, comments: e.target.value })
                    }}
                    placeholder='comment'
                    name='comments'
                  />
                </FormControl>
              </Grid>
            </Grid>
            {selectedPharmacy.type === 'local' && (
              <Divider
                sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
              />
            )}
            {console.log('disputeItemDetails?.delivery_status', disputeItemDetails?.delivery_status)}
            {disputeItemDetails?.delivery_status !== 'Delivered' && selectedPharmacy.type === 'local' ? (
              <>
                <LoadingButton
                  sx={{ float: 'right', my: 4, mx: 2 }}
                  size='large'
                  disabled={disableButton()}
                  variant='contained'
                  onClick={() => {
                    updateStatus()
                  }}
                  loading={submitLoader}
                >
                  Save
                </LoadingButton>
                <LoadingButton
                  sx={{ float: 'right', my: 4, mx: 6 }}
                  size='large'
                  // disabled={disableButton()}
                  variant='contained'
                  onClick={() => {
                    bulkStatusUpdate()
                  }}
                  loading={submitLoader}
                >
                  Mark all as Received & Save
                </LoadingButton>
              </>
            ) : null}
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}
    </>
  )
}

export default OrderReceiveForm
