/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect } from 'react'

import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import DataGrid from 'src/@core/theme/overrides/dataGrid'
import Dialog from '@mui/material/Dialog'
import CustomChip from 'src/@core/components/mui/chip'
import {
  Grid,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  Box,
  Button,
  Chip,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material'
import { LoadingButton } from '@mui/lab'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Fade from '@mui/material/Fade'
import toast from 'react-hot-toast'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

import { useRouter } from 'next/router'

import Router from 'next/router'
import { column } from 'stylis'

import FulfillDialog from 'src/components/pharmacy/request/FulfillDialog'
import ShipRequest from 'src/components/pharmacy/request/ShipRequestForm'
import { getRequestItemsListById } from 'src/lib/api/getRequestItemsList'
import { getShipmentOrderDetails, addDisputeItems } from 'src/lib/api/getShipmentList'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})
function OrderReceiveForm({ orderId }) {
  const defaultValues = {
    from_store_name: '',
    to_store_name: '',
    shipment_date: '',
    person_shipping: '',
    vehicle_no: '',

    shipment_id: '',
    dispatch_id: '',
    request_id: '',
    comments: '',
    dispute_item_details: [
      {
        id: '',
        stock_id: '',
        stock_name: '',
        batch_no: '',
        return_count: '',
        from_store: '',
        to_store: '',
        from_store_name: '',
        to_store_name: '',
        status: ''
      }
    ]
  }

  const handleStatusChange = (itemId, event) => {
    console.log('itemId', itemId)
    console.log('event.target.value', event.target.value)

    // const updatedData = {
    //   ...orderData,
    //   dispute_item_details: orderData.dispute_item_details.map(item =>
    //     item.id === itemId ? { ...item, status: event.target.value } : item
    //   )
    // }

    const updatedData = {
      ...disputeItemDetails,
      dispute_item_details: disputeItemDetails.dispute_item_details.map(item =>
        item.id === itemId ? { ...item, status: event.target.value } : item
      )
    }
    setDisputeItemDetails(updatedData)
    // setOrderData(updatedData)
  }

  const schema = yup.object().shape({
    dispute_item_details: yup.array().of(
      yup.object().shape({
        status: yup.string().required('status required')
      })
    )
  })

  const {
    reset,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })
  const options = ['Received', 'Broken', 'Missing', 'Wrong count', 'Expired', 'Shipped']

  const getOrderDetails = async orderId => {
    try {
      const response = await getShipmentOrderDetails(orderId)
      console.log('response', response)
      console.log('response', response.data)

      if (response.success === true && response.data !== '') {
        const disputeLineItems = response?.data?.shipment_item_details?.map(el => {
          const data = {
            id: el?.id,
            stock_id: el?.stock_id,
            batch_no: el?.batch,
            return_count: el?.return_count,
            from_store: el?.from_store,
            to_store: el?.to_store,
            stock_name: el?.stock_name,
            from_store_name: el?.from_store_name,
            to_store_name: el?.to_store_name,
            status: response?.data?.shipment_status
          }

          return data
        })
        console.log('line item data', disputeLineItems)

        const deputesData = {
          from_store_name: response?.data?.shipment_item_details[0]?.from_store_name,
          to_store_name: response?.data?.shipment_item_details[0]?.to_store_name,
          shipment_date: response?.data?.shipment_date,
          person_shipping: response?.data?.person_shipping,
          vehicle_no: response?.data?.vehicle_no,

          shipment_id: response?.data?.shipment_id,
          dispatch_id: response?.data?.dispatch_id,
          request_id: response?.data?.request_id,
          dispute_item_details: disputeLineItems
        }
        console.log('deputesData', deputesData)
        // setValue(deputesData)
        reset(deputesData)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    if (orderId) {
      getOrderDetails(orderId)
    }
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'index',
      headerName: 'Sl',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.index}
          {console.log('params.row.id', params.row.index)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'stock_name',
      headerName: 'Medicine Name',
      renderCell: (params, rowIndex) => (
        <div>
          <Typography
            onClick={() => {
              console.log('rowIndex', rowIndex)
            }}
            variant='body2'
            sx={{ color: 'text.primary' }}
          >
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
      minWidth: 20,
      field: '',
      headerName: 'Action',
      renderCell: params => (
        <FormControl fullWidth>
          <InputLabel
            // error={Boolean(errors?.dispute_item_details?.[params.row.id]?.status)}
            id='status'
          >
            Status
          </InputLabel>
          <Controller
            name={`dispute_item_details[${params.row.index}].status`}
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <Select
                type='text'
                size='small'
                name={`dispute_item_details[${params.row.index}].status`}
                value={params.row.status}
                // value={value}
                label='Status'
                onChange={onChange}
                // onChange={event => handleStatusChange(params.row.index, event)}
                error={Boolean(errors?.dispute_item_details?.[params.row.index]?.status)}
              >
                {options.map((item, index) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
          {errors?.employer && (
            <FormHelperText sx={{ color: 'error.main' }}>{errors?.employer?.message}</FormHelperText>
          )}
        </FormControl>
      )
    }
  ]

  const updateStatus = async params => {
    const {
      shipment_id,
      shipment_date,
      traking_information,
      person_shipping,
      shipment_status,
      vehicle_no,
      from_store_name,
      to_store_name,
      dispute_item_details
    } = params

    const payLoad = {
      shipment_id,
      shipment_date,
      traking_information,
      person_shipping,
      shipment_status,
      vehicle_no,
      from_store_name,
      to_store_name,
      dispute_item_details
    }
    console.log('payload', payLoad)
  }

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'dispute_item_details'
  })

  return (
    <>
      <Grid xs={12} sx={{ mx: 'auto' }}>
        <Grid container xs={12}>
          {getValues('shipment_id') ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>Shipping id</h5>
              <p>{getValues('shipment_id')}</p>
            </Grid>
          ) : null}
          {getValues('rom_store_name') ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}> From Store </h5>
              <p>{getValues('rom_store_name')}</p>
            </Grid>
          ) : null}
          {getValues('shipment_date') ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>Shipped Date</h5>
              <p>{getValues('shipment_date')}</p>
            </Grid>
          ) : null}
          {getValues('vehicle_no') ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>Vehicle Number</h5>
              <p>{getValues('Vehicle_no')}</p>
            </Grid>
          ) : null}
          {getValues('to_store_name') ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>To Store </h5>
              <p>{getValues('to_store_name')}</p>
            </Grid>
          ) : null}

          {getValues('person_shipping') ? (
            <Grid item md={4} sm={4} xs={4}>
              <h5 style={{ marginBottom: '0px' }}>Driver details</h5>
              <p>{getValues('person_shipping')}</p>
            </Grid>
          ) : null}
        </Grid>
        {/* <Button
          variant='contained'
          onClick={() => {
            const addStatus = orderData?.dispute_item_details.map(el => {
              const data = {
                id: el.id,
                shipment_id: el.shipment_id,
                dispatch_id: el.dispatch_id,
                dispatch_item_id: el.dispatch_item_id,
                stock_id: el.stock_id,
                batch: el.batch,
                expiry: el.expiry,
                quantity: el.quantity,
                created_by: el.created_by,
                created_at: el.created_at,
                stock_name: el.stock_name,
                shipment_status: 'Received'
              }
              console.log('updated data', data)

              return data
            })
            setOrderData({
              ...orderData,
              shipment_id: orderData?.shipment_id,
              shipment_date: orderData?.shipment_date,
              traking_information: orderData?.traking_information,
              person_shipping: orderData?.person_shipping,
              shipment_status: orderData?.shipment_status,
              vehicle_no: orderData?.vehicle_no,
              from_store_name: orderData?.from_store_name,
              to_store_name: orderData?.to_store_name,

              // dispute_item_details: response?.data?.dispute_item_details
              dispute_item_details: addStatus
            })
          }}
        >
          Select all
        </Button> */}

        <form autoComplete='off' onSubmit={handleSubmit(updateStatus)}>
          {console.log('fields table', fields)}

          {fields?.length > 0 ? (
            <>
              <Divider
                sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
              />
              <Grid md={12} sm={12} xs={12} sx={{ my: 2 }}>
                <TableBasic
                  columns={columns}
                  rows={fields?.map((row, index) => ({ ...row, index: index + 1 }))}
                ></TableBasic>
              </Grid>
            </>
          ) : null}

          <Grid container items>
            <Grid item md={4} sm={4} xs={12} sx={{ mr: 6 }}>
              <FormControl fullWidth>
                <Controller
                  name='comment'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      type='text'
                      label='Comment'
                      value={value}
                      onChange={onChange}
                      placeholder='comment'
                      error={Boolean(errors.comment)}
                      name='comment'
                    />
                  )}
                />
                {errors.comment && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.comment.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
          <Divider
            sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
          />
          <LoadingButton
            sx={{ float: 'right', my: 4, mx: 6 }}
            size='large'
            variant='contained'
            type='submit'

            // loading={submitLoader}
          >
            Save
          </LoadingButton>
        </form>
      </Grid>
    </>
  )
}

export default OrderReceiveForm
