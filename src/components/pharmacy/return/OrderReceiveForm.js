/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect } from 'react'
import TableBasic from 'src/views/table/data-grid/TableBasic'

import { Grid, FormControl, InputLabel, Select, MenuItem, TextField, Divider, Box, Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import FormHelperText from '@mui/material/FormHelperText'
import Icon from 'src/@core/components/icon'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import toast from 'react-hot-toast'

import {
  getShipmentOrderDetails,
  addDisputeItems,
  addDispenseItems,
  getDisputeItemById,
  getShipmentStatusList,
  resolveDisputeItems
} from 'src/lib/api/pharmacy/getShipmentList'

import { updateShipmentRequest } from 'src/lib/api/pharmacy/getRequestItemsList'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'

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

  const [disputeItemDetails, setDisputeItemDetails] = useState(defaultValues)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [statusOptions, setStatusOptions] = useState([])

  const [orderData, setOrderData] = useState([])

  const { selectedPharmacy } = usePharmacyContext()

  const handleStatusChange = (itemId, event) => {
    console.log('eventsss', event)
    const { name, value } = event.target
    console.log('name', name)
    console.log('value', value)

    const updatedData = {
      ...disputeItemDetails,
      item_details: disputeItemDetails.item_details.map(item =>
        // item.id === itemId ? { ...item, status: event.target.value } : item
        item.id === itemId ? { ...item, [name]: value } : item
      )
    }
    // debugger
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
      console.log('getOrderDetails', response?.data)
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

        const disputesData = {
          shipment_id: orderId,
          store_id: response?.data?.shipment_item_details[0]?.from_store,
          // dispatch_id: response?.data?.dispatch_id,
          request_id: requestId,
          item_details: disputeLineItems,
          comments: response?.data?.comments
        }

        setDisputeItemDetails(disputesData)
      }
    } catch (error) {
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
    if (orderData?.item_details) {
      const allReceived = orderData?.item_details.every(item => item.status !== '')

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

  const resolveItems = async payload => {
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
        request_id: requestId,
        request_item_id: payload.request_item_id,
        type: 'Shortage',
        action: 'accept'
      }
    }

    console.log('payload', itemsToResolve)
    try {
      const resolved = resolveDisputeItems(itemsToResolve)
      console.log('resolve response ', resolved)
    } catch (error) {
      console.log('error', error)
    }
  }

  const columns = [
    // {
    //   flex: 0.05,
    //   Width: 40,
    //   field: 'uid',
    //   headerName: 'Sl',
    //   renderCell: (params, rowId) => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.uid}
    //     </Typography>
    //   )
    // },
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
      field: 'from_store_name',
      headerName: 'Shipped from',
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
      headerName: 'Shipped To',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.to_store_name}
        </Typography>
      )
    },

    {
      flex: 0.4,
      minWidth: 200,
      field: 'status',
      // headerName: 'Status',
      headerName: selectedPharmacy?.type === 'central' ? 'Actions' : 'Status',
      renderCell: params => (
        <>
          {selectedPharmacy.type === 'local' ? (
            <>
              <Grid sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant='p' sx={{ mx: 2 }}>
                  {params.row.status === 'Wrong Count'
                    ? `${params?.row?.wrong_count_type}  ${params?.row?.wrong_count_number}`
                    : params.row.status}
                </Typography>
                {params?.row?.dispute_status === 'Not Resolved' ? (
                  <>
                    <Button
                      size='small'
                      variant='contained'
                      onClick={() => {
                        resolveItems(params.row)
                      }}
                    >
                      Accept
                    </Button>
                    <Button size='small' color='error' variant='contained'>
                      Deny
                    </Button>
                  </>
                ) : null}
              </Grid>
            </>
          ) : (
            <>
              {params.row.status === 'Wrong Count' ? (
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
                      disabled={disableButton()}
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
                  <Grid xs={12} sm={12}>
                    <FormControl fullWidth size='small'>
                      {console.log('line item', params?.row?.status)}
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
                            {item?.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </>
      )
    }
  ]

  async function updateStatus() {
    const isStatusEmpty = disputeItemDetails.item_details.some(item => item.status.trim() === '')

    if (isStatusEmpty) {
      console.error('Please fill in all status fields.')

      return
    }
    const receivedItems = disputeItemDetails?.item_details
    // const notReceivedItems = disputeItemDetails?.item_details

    // const receivedItems = disputeItemDetails?.item_details?.filter(item => item.status === 'Received')
    // const notReceivedItems = disputeItemDetails?.item_details?.filter(item => item.status !== 'Received')

    console.log('receivedItems: ', receivedItems)
    // console.log('notReceivedItems: ', notReceivedItems)
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
        // "shipment_item_id": "108",
        // "shipment_date": "2023-12-07",
        // "person_shipping": "Test",
        // "status": "Shipped",
        // "vehicle_no": "KA01AB1234",
        // "picked_up": "",
        // "dispatch_id": "129",
        // "dispatch_item_id": "153",
        // "from_store_id": "14",
        // "to_store_id": "16",
        // "item_status": "Wrong Count",
        // "request_id": "130",
        // "comments": "test"
      })

      //setSubmitLoader(true)
      // const finalData = { ...disputeItemDetails, item_details: receivedItems }
      const verifyCount = finalReceivedItems.some(el => {
        if (el.item_status === 'Wrong Count') {
          if (el.wrong_count_number === '' || el.wrong_count_type === '') {
            console.log('hello', el.to_store_name)

            return false
          }
        }

        return true
      })
      console.log('finalReceivedItemssssss', finalReceivedItems)
      console.log('verifyCount', verifyCount)
      if (verifyCount) {
        try {
          const result = await updateShipmentRequest(orderId, finalReceivedItems)
          console.log('in block', finalReceivedItems)

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
    // if (notReceivedItems.length > 0) {
    //   setSubmitLoader(true)

    //   const finalData = { ...disputeItemDetails, item_details: notReceivedItems }
    //   try {
    //     const result = await addDisputeItems(finalData)
    //     if (result?.success) {
    //       toast.success(result?.message)
    //       setSubmitLoader(false)
    //     }
    //   } catch (error) {
    //     setSubmitLoader(false)

    //     toast.error(error?.message)
    //     console.log('Add dispute error', error)
    //   }
    // }
    // closeOrderFormDialog()
  }

  return (
    <>
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
                  disabled={selectedPharmacy.type === 'local' ? 'disabled' : null}
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
          {selectedPharmacy.type === 'central' && (
            <Divider
              sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
            />
          )}
          {selectedPharmacy.type === 'central' && (
            <LoadingButton
              sx={{ float: 'right', my: 4, mx: 6 }}
              size='large'
              // disabled={disableButton()}
              variant='contained'
              onClick={() => {
                updateStatus()
              }}
              loading={submitLoader}
            >
              Save
            </LoadingButton>
          )}
        </Grid>
      </Grid>
    </>
  )
}

export default OrderReceiveForm
