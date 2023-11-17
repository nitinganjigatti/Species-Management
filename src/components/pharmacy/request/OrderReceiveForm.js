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
import { useForm, Controller } from 'react-hook-form'
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
import { getShipmentOrderDetails } from 'src/lib/api/getShipmentList'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})
function OrderReceiveForm({ orderId }) {
  const defaultValues = {
    shipment_id: '',
    shipment_date: '',
    traking_information: '',
    person_shipping: '',
    shipment_status: '',
    vehicle_no: '',
    from_store_name: '',
    to_store_name: '',
    shipment_item_details: []
  }
  const [values, setValues] = useState(defaultValues)
  const [orderData, setOrderData] = useState([])

  const schema = yup.object().shape({
    shipment_status: yup.string().required('order is required')
  })

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })
  const options = ['Received', 'Broken/damaged', 'Missing', 'Wrong count', 'Expired', 'Shipped']

  const getOrderDetails = async orderId => {
    // const result = await getdatta()
    // const response = await getShipmentOrderDetails('52')

    const response = await getShipmentOrderDetails(orderId)
    console.log('response', response)
    console.log('response', response.data)

    // const response = getRequestItemsListById('83')
    console.log('check', response.success === true && response.data !== '')
    if (response.success === true && response.data !== '') {
      // setOrderData(response.data)
      const addStatus = response?.data?.shipment_item_details.map(el => {
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
          shipment_status: response?.data?.shipment_status
        }
        console.log('updated data', data)

        return data
      })
      setOrderData({
        ...orderData,
        shipment_id: response?.data?.shipment_id,
        shipment_date: response?.data?.shipment_date,
        traking_information: response?.data?.traking_information,
        person_shipping: response?.data?.person_shipping,
        shipment_status: response?.data?.shipment_status,
        vehicle_no: response?.data?.vehicle_no,
        from_store_name: response?.data?.from_store_name,
        to_store_name: response?.data?.to_store_name,

        // shipment_item_details: response?.data?.shipment_item_details
        shipment_item_details: addStatus
      })

      const data = {
        shipment_id: response?.data?.shipment_id,
        shipment_date: response?.data?.shipment_date,
        traking_information: response?.data?.traking_information,
        person_shipping: response?.data?.person_shipping,
        shipment_status: response?.data?.shipment_status,
        vehicle_no: response?.data?.vehicle_no,
        from_store_name: response?.data?.from_store_name,
        to_store_name: response?.data?.to_store_name,

        // shipment_item_details: response?.data?.shipment_item_details
        shipment_item_details: addStatus
      }
      reset(data)
    }

    // if (response.success === true && response.data.length > 0) {
    //   setOrderData(response.data)

    //   // setLoader(false)
    // } else {
    //   // setLoader(false)
    // }
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
      field: 'batch',
      headerName: 'Batch',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'quantity',
      headerName: 'Quantity',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.quantity}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: '',
      headerName: 'Action',
      renderCell: params => (
        // <FormControl fullWidth>
        //   <InputLabel error={Boolean(errors?.shipment_status)} id='status'>
        //     Status
        //   </InputLabel>
        //   <Controller
        //     name={`shipment_item_details[${params.row.id}].shipment_status`}
        //     // name='shipment_item_details.shipment_status'
        //     control={control}
        //     rules={{ required: true }}
        //     render={({ field: { value, onChange } }) => (
        //       <Select
        //         size='small'
        //         name={`shipment_item_details[${params.row.id}].shipment_status`}
        //         // name='shipment_item_details.shipment_status'
        //         value={value}
        //         label='Status'
        //         onChange={e => {
        //           onChange(e)
        //         }}

        //         // error={Boolean(errors?.shipment_item_details.shipment_status)}
        //       >
        //         {options?.map((item, index) => (
        //           <MenuItem key={index} value={item}>
        //             {item}
        //           </MenuItem>
        //         ))}
        //       </Select>
        //     )}
        //   />
        //   {errors?.shipment_item_details.shipment_status && (
        //     <FormHelperText sx={{ color: 'error.main' }}>
        //       {errors?.shipment_item_details.shipment_status?.message}
        //     </FormHelperText>
        //   )}
        // </FormControl>
        <FormControl fullWidth>
          <InputLabel error={Boolean(errors?.shipment_status)} id='status'>
            Status
          </InputLabel>
          <Select
            size='small'
            name={`shipment_item_details[${params.row.id}].shipment_status`}
            value={params.row.shipment_status}
            label='Status'
            onChange={e => (params.row.shipment_status = e.target.value)}
            error={Boolean(errors?.shipment_status)}
          >
            {options.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
          {/* Error handling for shipment_status */}
          {/* {params.row.shipment_item_details.map(
            (item, index) =>
              errors?.shipment_item_details?.[index]?.shipment_status && (
                <Typography key={index} variant='body2' sx={{ color: 'error.main' }}>
                  {errors?.shipment_item_details?.[index]?.shipment_status?.message}
                </Typography>
              )
          )} */}
        </FormControl>
      )
    }
  ]
  useEffect(() => {}, [orderData.shipment_item_details])

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
      shipment_item_details
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
      shipment_item_details
    }
    console.log('payload', payLoad)
    console.log('orderData', orderData)
  }

  return (
    <>
      <Grid xs={12} sx={{ mx: 'auto' }}>
        {/* <CardHeader title={`Order received`} /> */}
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
        {/* <Button
          variant='contained'
          onClick={() => {
            const addStatus = orderData?.shipment_item_details.map(el => {
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

              // shipment_item_details: response?.data?.shipment_item_details
              shipment_item_details: addStatus
            })
          }}
        >
          Select all
        </Button> */}
        {orderData?.shipment_item_details?.length > 0 ? (
          <>
            <Divider
              sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
            />
            <Grid md={12} sm={12} xs={12} sx={{ my: 2 }}>
              {console.log('collll', orderData?.shipment_item_details)}
              <TableBasic columns={columns} rows={orderData?.shipment_item_details}></TableBasic>
            </Grid>
          </>
        ) : null}

        <form autoComplete='off' onSubmit={handleSubmit(updateStatus)}>
          <Grid container items>
            {/* <Grid item md={4} sm={4} xs={12} sx={{ mr: 6 }}>
              <FormControl fullWidth>
                <InputLabel error={Boolean(errors?.shipment_status)} id='status'>
                  Status
                </InputLabel>
                <Controller
                  name='shipment_status'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      name='shipment_status'
                      value={value}
                      label='Status'
                      onChange={e => {
                        onChange(e)
                      }}
                      error={Boolean(errors?.shipment_status)}
                    >
                      {options?.map((item, index) => (
                        <MenuItem key={index} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors?.shipment_status && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.shipment_status?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid> */}
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
