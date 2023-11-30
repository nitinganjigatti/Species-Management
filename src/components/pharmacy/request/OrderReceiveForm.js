/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect } from 'react'
import TableBasic from 'src/views/table/data-grid/TableBasic'

import { Grid, FormControl, InputLabel, Select, MenuItem, TextField, Divider } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import FormHelperText from '@mui/material/FormHelperText'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import toast from 'react-hot-toast'

import {
  getShipmentOrderDetails,
  addDisputeItems,
  addDispenseItems,
  getDisputeItemById
} from 'src/lib/api/getShipmentList'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

function OrderReceiveForm({ orderId, disputeId }) {
  const defaultValues = {
    shipment_id: '',
    dispatch_id: '',
    request_id: '',
    comments: '',
    store_id: '',
    item_details: [
      {
        id: '',
        stock_id: '',
        stock_name: '',
        count: '',
        batch_no: '',
        from_store: '',
        to_store: '',
        from_store_name: '',
        to_store_name: '',
        status: ''
      }
    ]
  }

  const [disputeItemDetails, setDisputeItemDetails] = useState(defaultValues)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [orderData, setOrderData] = useState([])

  const buttonStatus = disputeItemDetails?.item_details.every(el => {
    return el.status !== ''
  })

  console.log('buttonStatus', buttonStatus)

  const handleStatusChange = (itemId, event) => {
    const updatedData = {
      ...disputeItemDetails,
      item_details: disputeItemDetails.item_details.map(item =>
        item.id === itemId ? { ...item, status: event.target.value } : item
      )
    }
    setDisputeItemDetails(updatedData)
  }

  const options = ['Received', 'Broken', 'Missing', 'Wrong count', 'Expired', 'Shipped']

  const getOrderDetails = async orderId => {
    try {
      const response = await getShipmentOrderDetails(orderId)
      console.log('response', response)

      if (response.success === true && response.data !== '') {
        setOrderData({
          ...orderData,

          shipping_id: response?.data?.shipping_id,
          shipment_id: response?.data?.shipment_id,
          shipment_date: response?.data?.shipment_date,
          person_shipping: response?.data?.person_shipping,
          shipment_status: response?.data?.shipment_status,
          vehicle_no: response?.data?.vehicle_no
        })

        const disputeLineItems = response?.data?.shipment_item_details?.map(el => {
          const data = {
            id: el?.id,
            stock_id: el?.stock_id,
            batch_no: el?.batch,
            count: el?.quantity,
            from_store: el?.from_store,
            to_store: el?.to_store,
            stock_name: el?.stock_name,
            from_store_name: el?.from_store_name,
            to_store_name: el?.to_store_name,
            status: el.dispute_status ? el.dispute_status : ''
          }

          return data
        })

        const deputesData = {
          shipment_id: orderId,
          store_id: response?.data?.shipment_item_details[0]?.from_store,
          dispatch_id: response?.data?.dispatch_id,
          request_id: response?.data?.request_id,
          item_details: disputeLineItems
        }

        setDisputeItemDetails(deputesData)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    if (orderId) {
      getOrderDetails(orderId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      flex: 0.2,
      minWidth: 40,
      my: 4,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Grid item xs={12} sm={12}>
          {/* {params?.row?.status === '' ? ( */}
          <FormControl fullWidth>
            <InputLabel id={`status-${params?.row?.id}`} error={params?.row?.status.trim() === ''}>
              Status
            </InputLabel>
            <Select
              // disabled={buttonStatus}
              fullWidth
              size='small'
              error={Boolean(params?.row?.status === '' ? `This field is required` : '')}
              value={params?.row?.status}
              label='Status'
              onChange={event => handleStatusChange(params.row.id, event)}
            >
              {options.map((item, index) => (
                <MenuItem key={index} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* ) : (
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params?.row?.status}
            </Typography>
          )} */}
        </Grid>
      )
    }
  ]

  async function updateStatus() {
    const isStatusEmpty = disputeItemDetails.item_details.some(item => item.status.trim() === '')

    if (isStatusEmpty) {
      console.error('Please fill in all status fields.')

      return
    }
    const receivedItems = disputeItemDetails?.item_details?.filter(item => item.status === 'Received')
    const notReceivedItems = disputeItemDetails?.item_details?.filter(item => item.status !== 'Received')

    if (receivedItems.length > 0) {
      setSubmitLoader(true)
      const finalData = { ...disputeItemDetails, item_details: receivedItems }
      try {
        const result = await addDispenseItems(finalData)
        console.log('after submission of dispense items', result)

        if (result?.success) {
          toast.success(result?.message)
          setSubmitLoader(false)
        }
      } catch (error) {
        setSubmitLoader(false)

        console.log('Add dispense error', error)
        toast.error(error?.message)
      }
    }
    if (notReceivedItems.length > 0) {
      setSubmitLoader(true)

      const finalData = { ...disputeItemDetails, item_details: notReceivedItems }
      try {
        const result = await addDisputeItems(finalData)
        console.log('after submission of dispute items', result)
        if (result?.success) {
          toast.success(result?.message)
          setSubmitLoader(false)
        }
      } catch (error) {
        setSubmitLoader(false)

        toast.error(error?.message)
        console.log('Add dispute error', error)
      }
    }
  }

  const viewSingleDisputeItem = async disputeId => {
    try {
      const result = await getDisputeItemById(disputeId)
      console.log('single dispute item', result)
    } catch (error) {
      console.log('error', error)
      console.log('disputeId', disputeId)
    }
  }
  useEffect(() => {
    if (disputeId) {
      viewSingleDisputeItem(disputeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Grid xs={12} sx={{ mx: 'auto' }}>
        <Grid container xs={12}>
          {orderData?.shipment_id ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>Shipping id</h5>
              <p>{orderData.shipment_id}</p>
            </Grid>
          ) : null}
          {orderData?.from_store_name ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}> From Store </h5>
              <p>{orderData.from_store_name}</p>
            </Grid>
          ) : null}
          {orderData?.shipment_date ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>Shipped Date</h5>
              <p>{orderData.shipment_date}</p>
            </Grid>
          ) : null}
          {orderData?.vehicle_no ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>Vehicle Number</h5>
              <p>{orderData.vehicle_no}</p>
            </Grid>
          ) : null}
          {orderData?.to_store_name ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>To Store </h5>
              <p>{orderData.to_store_name}</p>
            </Grid>
          ) : null}

          {orderData?.person_shipping ? (
            <Grid item md={4} sm={4} xs={4}>
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
          <Grid item md={4} sm={4} xs={12} sx={{ mr: 6 }}>
            <FormControl fullWidth>
              <TextField
                // disabled={buttonStatus}
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
        <Divider
          sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
        />
        <LoadingButton
          sx={{ float: 'right', my: 4, mx: 6 }}
          size='large'
          // disabled={buttonStatus}
          variant='contained'
          onClick={() => {
            updateStatus()
          }}
          loading={submitLoader}
        >
          Save
        </LoadingButton>
      </Grid>
    </>
  )
}

export default OrderReceiveForm
