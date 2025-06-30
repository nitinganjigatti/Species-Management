/* eslint-disable lines-around-comment */
import React, { useState, forwardRef, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'

// ** MUI Imports

import {
  Grid,
  Radio,
  TextField,
  CardContent,
  FormControl,
  FormHelperText,
  FormControlLabel,
  Tooltip,
  Autocomplete,
  Box,
  CardHeader,
  Button,
  Divider
} from '@mui/material'

import { LoadingButton } from '@mui/lab'
import Router from 'next/router'
import { useRouter } from 'next/router'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import Typography from '@mui/material/Typography'

import UserSnackbar from 'src/components/utility/snackbar'
import SingleDatePicker from 'src/components/SingleDatePicker'

import Utility from 'src/utility'
import { shipRequestedItems } from 'src/lib/api/pharmacy/getRequestItemsList'
import { getDrivers } from 'src/lib/api/pharmacy/driver'
import Icon from 'src/@core/components/icon'
import { usePharmacyContext } from 'src/context/PharmacyContext'

// import { RadioGroup, FormLabel, FormControlLabel, Radio } from '@mui/material'

const defaultValues = {
  shipment_date: new Date().toISOString().slice(0, 10),
  person_shipping: null,
  delivery_mode: 'Shipped',
  vehicle_no: null,
  receiver_name: null,
  phone_number: null,
  name: ''
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField fullWidth inputRef={ref} {...props} />
})

const ShipRequest = ({ dispatchedItems, storeDetails, resetForm }) => {
  // ** Hooks
  const [submitLoader, setSubmitLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [options, setOptions] = useState([])
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('id')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

  const { selectedPharmacy } = usePharmacyContext()

  const [deliveryType, setDeliveryType] = useState({
    pickUp: false,
    Ship: true
  })

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })
  const [date, setDate] = useState(new Date())

  const schema = deliveryType.Ship
    ? yup.object().shape({
        person_shipping: yup
          .string()
          .min(3, 'Person Shipping Info must be at least 3 characters')
          .required('Person Shipping Info is required'),
        shipment_date: yup.string().required('Shipment Date is required'),

        // vehicle_no: yup.string().required('Vehicle Number is required'),
        // phone_number: yup
        //   .number()
        //   .required('Mobile Number is required')
        //   .test('is-valid-number', 'Mobile Number must be exactly 10 digits', value => {
        //     return /^\d{10}$/.test(value)
        //   }),
        phone_number: yup
          .string()
          .required('Mobile Number is required')
          .test('is-valid-number', 'Only numbers are allowed', value => {
            return /^\d*$/.test(value)
          })
          .test('is-valid-length', 'Mobile Number must be exactly 10 digits', value => {
            return value?.length === 10
          }),
        carton_box: yup
          .number()
          .typeError('Carton Box must be a number')
          .positive('Carton Box must be a positive number')
          .integer('Carton Box must be a whole number')
          .min(1, 'Carton Box must be greater than 0')
          .required('Carton Box is required')
      })
    : yup.object().shape({
        receiver_name: yup
          .string()
          .min(3, 'Person Receiving Info must be at least 3 characters')
          .required('Person Receiving  Info is required'),
        shipment_date: yup.string().required('Shipment Date is required'),
        // phone_number: yup
        //   .number()
        //   .required('Mobile Number is required')
        //   .test('is-valid-number', 'Mobile Number must be exactly 10 digits', value => {
        //     return /^\d{10}$/.test(value)
        //   }),
        phone_number: yup
          .string()
          .required('Mobile Number is required')
          .test('is-valid-number', 'Only numbers are allowed', value => {
            return /^\d*$/.test(value)
          })
          .test('is-valid-length', 'Mobile Number must be exactly 10 digits', value => {
            return value?.length === 10
          }),
        carton_box: yup
          .number()
          .typeError('Carton Box must be a number')
          .positive('Carton Box must be a positive number')
          .integer('Carton Box must be a whole number')
          .min(1, 'Carton Box must be greater than 0')
          .required('Carton Box is required')
      })

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const router = useRouter()
  const { id, action } = router.query

  function loadServerRows(currentPage, data) {
    return data
  }

  const getDriverList = useCallback(
    async (sort, q, column) => {
      try {
        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getDrivers({ params: params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setOptions(res?.data?.list_items)
          setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
        })
      } catch (e) {
        console.error(e)
      }
    },
    [paginationModel]
  )

  const searchDriver = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await getDriverList(sort, q, column)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const shipRequest = async payload => {
    try {
      setSubmitLoader(true)

      const response = await shipRequestedItems(payload)
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'success' })
        setSubmitLoader(false)
        reset(defaultValues)
        if (resetForm) {
          resetForm()
        } else {
          Router.back()
        }
        // close()
      } else {
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  useEffect(() => {
    getDriverList(sort, searchValue, sortColumn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDriverList])

  const onSubmit = async params => {
    setSubmitLoader(true)

    const { person_shipping, vehicle_no, receiver_name, phone_number, carton_box } = {
      ...params
    }

    const shipmentDate = Utility.formatDate(date)

    const payload = []

    dispatchedItems?.forEach((value, index) => {
      const payloadItem = {}
      payloadItem.dispatch_item_id = value.dispatch_item_id
      payloadItem.dispatch_id = value.dispatch_id
      payloadItem.shipment_date = shipmentDate
      payloadItem.person_shipping = person_shipping
      payloadItem.receiver_name = receiver_name
      payloadItem.status = deliveryType.Ship ? 'Shipped' : 'PickedUp'
      payloadItem.to_store_id = value?.to_store_id ? value?.to_store_id : storeDetails.to_store_id
      payloadItem.from_store_id = value?.from_store_id ? value?.from_store_id : storeDetails.from_store_id
      payloadItem.vehicle_no = vehicle_no
      payloadItem.phone_number = phone_number
      payloadItem.carton_box = carton_box

      payload.push(payloadItem)
    })

    shipRequest(payload)
  }

  const CustomInput = forwardRef(({ ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        {...props}
        sx={{ width: '100%' }}
        slotProps={{
          input: {
            autoComplete: 'off'
          }
        }}
      />
    )
  })

  const columns = [
    {
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
      width: 300,
      minWidth: 200,
      field: 'medicin_name',
      headerName: 'Product Name',
      renderCell: (params, rowId) => (
        <div>
          {/* <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.medicin_name}
          </Typography> */}
          <Tooltip title={params.row.medicin_name} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.medicin_name}
            </Typography>
          </Tooltip>
        </div>
      )
    },
    {
      minWidth: 200,
      field: 'from_store_name',
      headerName: 'Shipped from ',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <div>
          <Tooltip title={params.row.from_store_name} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.from_store_name}
            </Typography>
          </Tooltip>
        </div>
      )
    },

    {
      minWidth: 200,
      field: 'to_store_name',
      headerName: 'Shipped to',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <div>
          <Tooltip title={params.row.to_store_name} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.to_store_name}
            </Typography>
          </Tooltip>
        </div>
      )
    },
    {
      minWidth: 100,
      field: 'batch_no',
      headerName: 'Batch no',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      minWidth: 160,
      field: 'request_id',
      headerName: 'Request Id',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params?.row?.request_id}
        </Typography>
      )
    },

    // {
    //   flex: 0.1,
    //   minWidth: 100,
    //   field: 'Package',
    //   headerName: 'Package',
    //   renderCell: params => (
    //     <Tooltip title={params?.row?.package} placement='top'>
    //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //         {params?.row?.package}
    //       </Typography>
    //     </Tooltip>
    //   )
    // },
    // {
    //   flex: 0.1,
    //   minWidth: 150,
    //   field: 'manufacture',
    //   headerName: 'Manufacturer',
    //   renderCell: params => (
    //     <Tooltip title={params?.row?.manufacture} placement='top'>
    //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //         {params?.row?.manufacture}
    //       </Typography>
    //     </Tooltip>
    //   )
    // },
    {
      minWidth: 120,
      field: 'expiry_date',
      headerName: 'Expiry date',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.expiry_date) === 'Invalid date'
            ? 'NA'
            : Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },
    {
      minWidth: 130,
      field: 'dispatch_qty',
      headerName: 'Dispatch qty',
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.dispatch_qty}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'dispatch_status',
    //   headerName: 'Status',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.dispatch_status}
    //     </Typography>
    //   )
    // }
  ]

  const handleDeliveryTypeChange = type => {
    if (type === 'Ship') {
      setDeliveryType({ ...deliveryType, Ship: true, pickUp: false })
      setValue('receiver_name', '')
      setValue('delivery_mode', 'Shipped')
      setValue('name', '')
      setValue('phone_number', '')
      setValue('vehicle_no', '')
    } else {
      setDeliveryType({ ...deliveryType, Ship: false, pickUp: true })
      setValue('vehicle_no', '')
      setValue('person_shipping', '')
      setValue('delivery_mode', 'PickedUp')
      setValue('name', '')
      setValue('phone_number', '')
    }
  }

  return (
    <>
      <Grid container spacing={6} className='match-height'>
        <Grid item size={{ xs: 12 }}>
          <CardContent>
            {/* {dispatchedItems?.length > 0 ? (
           <Grid md={12} sm={12} xs={12} sx={{ mb: 14 }}>
             <TableBasic columns={columns} rows={dispatchedItems}></TableBasic>
           </Grid>
         ) : null} */}

            {/* <Grid md={12} sm={12} xs={12} sx={{ my: 6 }}>
           <FormControlLabel
             value={deliveryType.Ship}
             label='Ship'
             control={
               <Radio
                 onChange={() => {
                   handleDeliveryTypeChange('Ship')
                 }}
                 checked={deliveryType.Ship}
                 sx={deliveryType.Ship ? { color: 'error.main' } : null}
               />
             }
           />
           <FormControlLabel
             value={deliveryType.pickUp}
             label='Pickup'
             control={
               <Radio
                 onChange={() => {
                   handleDeliveryTypeChange('pickUp')
                 }}
                 checked={deliveryType.pickUp}
                 sx={deliveryType.pickUp ? { color: 'error.main' } : null}
               />
             }
           />
         </Grid> */}
            <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <CardHeader
                  avatar={
                    <Icon
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        Router.back()
                      }}
                      icon='ep:back'
                    />
                  }
                  title={`Shipment`}
                  action={
                    selectedPharmacy?.type === 'local' &&
                    storeDetails?.status === 'request' &&
                    storeDetails?.is_modified !== '1' ? (
                      <Button
                        size='big'
                        variant='contained'
                        onClick={() => {
                          // handleRequestEdit()
                        }}
                      >
                        Edit
                      </Button>
                    ) : (
                      <></>
                    )
                  }
                  sx={{ p: 0 }}
                />
                <Grid>
                  <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
                    Submit
                  </LoadingButton>
                  {openSnackbar.open ? (
                    <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
                  ) : null}
                </Grid>
              </Box>
              <Grid container sx={{ my: 6 }}>
                <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                  <Typography sx={{ color: 'customColors.customTextColorGray2', fontWeight: 500, fontSize: '1rem' }}>
                    {' '}
                    Shipped To:
                  </Typography>
                  <Typography sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '1rem', py: 2 }}>
                    {dispatchedItems?.[0]?.to_store_name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 12, md: 7 }}>
                  <Typography sx={{ color: 'customColors.customTextColorGray2', fontWeight: 500, fontSize: '1rem' }}>
                    Delivery Type
                  </Typography>
                  <FormControlLabel
                    value={deliveryType.Ship}
                    label='Ship'
                    control={
                      <Radio
                        onChange={() => {
                          handleDeliveryTypeChange('Ship')
                        }}
                        checked={deliveryType.Ship}
                        sx={deliveryType.Ship ? { color: 'error.main' } : null}
                      />
                    }
                  />
                  <FormControlLabel
                    value={deliveryType.pickUp}
                    label='Pickup'
                    control={
                      <Radio
                        onChange={() => {
                          handleDeliveryTypeChange('pickUp')
                        }}
                        checked={deliveryType.pickUp}
                        sx={deliveryType.pickUp ? { color: 'error.main' } : null}
                      />
                    }
                  />
                </Grid>
              </Grid>
              <Grid sx={{ my: 4 }}>
                <Divider />
              </Grid>
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Typography
                  sx={{
                    color: 'customColors.customTextColorGray2',
                    fontWeight: 500,
                    fontSize: '1rem',
                    width: '100%',
                    mx: 2
                  }}
                >
                  Shipment Details
                </Typography>
                {deliveryType.Ship ? (
                  <Grid
                    item
                    size={{ xs: 12, sm: 3 }}
                    sx={{
                      mb: 6
                    }}
                  >
                    <FormControl fullWidth>
                      <Controller
                        name='name'
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <Autocomplete
                            options={options}
                            value={value}
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props

                              return (
                                <li key={`${option.driver_name}-${option.phone_number}`} {...otherProps}>
                                  <Box>
                                    <Typography>{option.driver_name}</Typography>
                                    <Typography variant='body2'>{option.phone_number}</Typography>
                                    <Typography variant='body2'>{option.vehicle_number}</Typography>
                                  </Box>
                                </li>
                              )
                            }}
                            getOptionLabel={option => (option.driver_name ? option.driver_name : '')}
                            isOptionEqualToValue={(option, value) => option.value === value.driver_name}
                            onChange={(e, val) => {
                              if (val === null) {
                                setValue('person_shipping', '')
                                setValue('vehicle_no', '')
                                setValue('receiver_name', '')
                                setValue('phone_number', '')

                                return onChange(null)
                              } else {
                                setValue('person_shipping', val.driver_name)
                                setValue('vehicle_no', val.vehicle_number)
                                setValue('receiver_name', val.driver_name)
                                setValue('phone_number', val.phone_number)

                                return onChange(val)
                              }
                            }}
                            onBlur={e => {}}
                            onKeyUp={e => {
                              searchDriver(sort, e.target.value, sortColumn)
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Search & Select the Driver'
                                error={Boolean(errors.product)}
                                helperText={errors.product?.message}
                                slotProps={{
                                  inputLabel: {
                                    style: {
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      width: '80%'
                                    }
                                  }
                                }}
                              />
                            )}
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>
                ) : null}
                {deliveryType.Ship && (
                  <>
                    {/* // <Grid item size={{xs: 12, sm: 3}} mb={6}>
                  //   <FormControl fullWidth>
                  //     <Controller
                  //       name='driver_name'
                  //       control={control}
                  //       rules={{ required: true }}
                  //       render={({ field: { value, onChange } }) => (
                  //         <TextField
                  //           value={value}
                  //           label='Driver name *'
                  //           onChange={onChange}
                  //           placeholder=''
                  //           error={Boolean(errors.driver_name)}
                  //           name='driver_name'
                  //           InputLabelProps={{ shrink: true }}
                  //         />
                  //       )}
                  //     />
                  //     {errors.driver_name && (
                  //       <FormHelperText sx={{ color: 'error.main' }}>{errors.driver_name.message}</FormHelperText>
                  //     )}
                  //   </FormControl>
                  // </Grid> */}
                    <Grid
                      item
                      size={{ xs: 12, sm: 3 }}
                      sx={{
                        mb: 6
                      }}
                    >
                      <FormControl fullWidth>
                        <Controller
                          name='person_shipping'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              value={value}
                              label='Driver Name*'
                              onChange={onChange}
                              placeholder=''
                              error={Boolean(errors.person_shipping)}
                              name='person_shipping'
                              slotProps={{
                                inputLabel: { shrink: true }
                              }}
                            />
                          )}
                        />
                        {errors.person_shipping && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors.person_shipping.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </>
                )}
                {!deliveryType.Ship && (
                  <Grid
                    item
                    size={{ xs: 12, sm: 6 }}
                    sx={{
                      mb: 6
                    }}
                  >
                    <FormControl fullWidth>
                      <SingleDatePicker
                        fullWidth
                        width={'100%'}
                        date={date}
                        value={date}
                        name={'Shipment Date*'}
                        label='Shipment Date*'
                        placeholderText={'Shipment Date*'}
                        maxDate={new Date()}
                        onChangeHandler={date => {
                          setDate(date)
                        }}
                        customInput={<CustomInput label='Shipment Date*' auto />}
                      />
                      {errors.shipment_date && (
                        <FormHelperText sx={{ color: 'error.main' }}>Shipment Date is required</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}
                <Grid
                  item
                  size={{ xs: 12, sm: deliveryType.Ship ? 3 : 6 }}
                  sx={{
                    mb: 6
                  }}
                >
                  <FormControl fullWidth>
                    <Controller
                      name='phone_number'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          label='Mobile Number*'
                          onChange={onChange}
                          // onChange={e => {
                          //   const newValue = e.target.value.replace(/\D/g, '') // Remove non-numeric characters
                          //   onChange(newValue)
                          // }}
                          placeholder=''
                          error={Boolean(errors.phone_number)}
                          name='phone_number'
                          slotProps={{
                            inputLabel: { shrink: true }
                          }}
                        />
                      )}
                    />
                    {errors.phone_number && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.phone_number.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                {deliveryType.Ship ? (
                  <>
                    <Grid
                      item
                      size={{ xs: 12, sm: 3 }}
                      sx={{
                        mb: 6
                      }}
                    >
                      <FormControl fullWidth>
                        <Controller
                          name='vehicle_no'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              value={value}
                              label='Vehicle Number'
                              onChange={onChange}
                              placeholder=''
                              error={Boolean(errors.vehicle_no)}
                              name='vehicle_no'
                              slotProps={{
                                inputLabel: { shrink: true }
                              }}
                            />
                          )}
                        />
                        {errors.vehicle_no && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors.vehicle_no.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid
                      item
                      size={{ xs: 12, sm: 6 }}
                      sx={{
                        mb: 6
                      }}
                    >
                      <FormControl fullWidth>
                        <SingleDatePicker
                          fullWidth
                          width={'100%'}
                          date={date}
                          value={date}
                          name={'Shipment Date*'}
                          label='Shipment Date*'
                          placeholderText={'Shipment Date*'}
                          maxDate={new Date()}
                          onChangeHandler={date => {
                            setDate(date)
                          }}
                          customInput={<CustomInput label='Shipment Date*' auto />}
                        />
                        {errors.shipment_date && (
                          <FormHelperText sx={{ color: 'error.main' }}>Shipment Date is required</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    {/* <Grid item size={{xs: 12, sm: 6}} mb={6}>
                      <FormControl fullWidth>
                        <Controller
                          name='person_shipping'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              value={value}
                              label='Driver Name*'
                              onChange={onChange}
                              placeholder=''
                              error={Boolean(errors.person_shipping)}
                              name='person_shipping'
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        />
                        {errors.person_shipping && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors.person_shipping.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid> */}
                  </>
                ) : (
                  <>
                    <Grid item size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <Controller
                          name='receiver_name'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              value={value}
                              label='Receiver Name*'
                              onChange={onChange}
                              placeholder=''
                              error={Boolean(errors.receiver_name)}
                              name='receiver_name'
                              slotProps={{
                                inputLabel: { shrink: true }
                              }}
                            />
                          )}
                        />
                        {errors.receiver_name && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors.receiver_name.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </>
                )}
                {/* {deliveryType.Ship && ( */}
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <Controller
                      name='carton_box'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          label='No of Carton Boxes *'
                          onChange={onChange}
                          placeholder=''
                          error={Boolean(errors.carton_box)}
                          name='carton_box'
                          slotProps={{
                            inputLabel: { shrink: true }
                          }}
                        />
                      )}
                    />
                    {errors.carton_box && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.carton_box.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                {/* )} */}
                {/* <Grid item size={{xs: 12, sm: 6}}>
                  <FormControl fullWidth>
                    <SingleDatePicker
                      fullWidth
                      width={'100%'}
                      date={date}
                      value={date}
                      maxDate={new Date()}
                      name={'Shipment Date*'}
                      label='Shipment Date*'
                      placeholderText={'Shipment Date*'}
                      onChangeHandler={date => {
                        // console.log(date)
                        setDate(date)
                      }}
                      customInput={<CustomInput label='Shipment Date*' auto />}
                      isClearable={false}
                    />
                    {errors.shipment_date && (
                      <FormHelperText sx={{ color: 'error.main' }}>Shipment Date is required</FormHelperText>
                    )}
                  </FormControl>
                </Grid> */}
                {/* {deliveryType.Ship ? (
                  <>
                    <Grid item size={{xs: 12, sm: 6}}>
                      <FormControl fullWidth>
                        <Controller
                          name='vehicle_no'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              value={value}
                              label='Vehicle Number'
                              onChange={onChange}
                              placeholder=''
                              error={Boolean(errors.vehicle_no)}
                              name='vehicle_no'
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        />
                        {errors.vehicle_no && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors.vehicle_no.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item size={{xs: 12, sm: 6}}>
                      <FormControl fullWidth>
                        <Controller
                          name='person_shipping'
                          control={control}
                          rules={{ required: true }}
                          render={({ field: { value, onChange } }) => (
                            <TextField
                              value={value}
                              label='Person Shipping*'
                              onChange={onChange}
                              placeholder=''
                              error={Boolean(errors.person_shipping)}
                              name='person_shipping'
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        />
                        {errors.person_shipping && (
                          <FormHelperText sx={{ color: 'error.main' }}>{errors.person_shipping.message}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </>
                ) : (
                  <Grid item size={{xs: 12, sm: 6}}>
                    <FormControl fullWidth>
                      <Controller
                        name='receiver_name'
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <TextField
                            value={value}
                            label='Receiver Name*'
                            onChange={onChange}
                            placeholder=''
                            error={Boolean(errors.receiver_name)}
                            name='receiver_name'
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                      {errors.receiver_name && (
                        <FormHelperText sx={{ color: 'error.main' }}>{errors.receiver_name.message}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )} */}
                {/* <Grid item size={{xs: 12, sm: 6}}>
               <FormControl fullWidth>
                 <Controller
                   name='delivery_mode'
                   control={control}
                   rules={{ required: true }}
                   render={({ field: { value, onChange } }) => (
                     <TextField
                       value={value}
                       label='Delivery Mode*'
                       onChange={onChange}
                       placeholder=''
                       error={Boolean(errors.delivery_mode)}
                       name='delivery_mode'
                     />
                   )}
                 />
                 {errors.delivery_mode && (
                   <FormHelperText sx={{ color: 'error.main' }}>{errors.delivery_mode.message}</FormHelperText>
                 )}
               </FormControl>
             </Grid> */}
                {/* <Grid item size={{xs: 12, sm: 6}}>
                  <FormControl fullWidth>
                    <Controller
                      name='phone_number'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          label='Mobile number*'
                          onChange={onChange}
                          placeholder=''
                          error={Boolean(errors.phone_number)}
                          name='phone_number'
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                    {errors.phone_number && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.phone_number.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid> */}
                {/* <Grid item size={{xs: 12}}>
               <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
                 Submit
               </LoadingButton>
               {openSnackbar.open ? (
                 <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
               ) : null}
             </Grid> */}
              </Grid>
              <Grid>
                <Divider />
              </Grid>
            </form>
            <Box sx={{ mt: 6 }}>
              {dispatchedItems?.length > 0 ? (
                <Grid size={{ xs: 12, sm: 12, md: 12 }} sx={{ mb: 14 }}>
                  <TableBasic
                    columns={columns}
                    rows={dispatchedItems}
                    backgroundColor={'customColors.customTableHeaderBg'}
                  ></TableBasic>
                </Grid>
              ) : null}
            </Box>
          </CardContent>
        </Grid>
      </Grid>
    </>
  )
}

export default ShipRequest

// import React, { useState, forwardRef, useEffect, useCallback } from 'react'
// import { debounce } from 'lodash'

// // ** MUI Imports

// import {
//   Grid,
//   Radio,
//   TextField,
//   CardContent,
//   FormControl,
//   FormHelperText,
//   FormControlLabel,
//   Tooltip,
//   Autocomplete,
//   Box,
//   CardHeader,
//   Button
// } from '@mui/material'

// import { LoadingButton } from '@mui/lab'
// import Router from 'next/router'
// import { useRouter } from 'next/router'
// import * as yup from 'yup'
// import { yupResolver } from '@hookform/resolvers/yup'
// import { useForm, Controller } from 'react-hook-form'
// import TableBasic from 'src/views/table/data-grid/TableBasic'
// import Typography from '@mui/material/Typography'

// import UserSnackbar from 'src/components/utility/snackbar'
// import SingleDatePicker from 'src/components/SingleDatePicker'

// import Utility from 'src/utility'
// import { shipRequestedItems } from 'src/lib/api/pharmacy/getRequestItemsList'
// import { getDrivers } from 'src/lib/api/pharmacy/driver'
// import Icon from 'src/@core/components/icon'
// import { usePharmacyContext } from 'src/context/PharmacyContext'

// // import { RadioGroup, FormLabel, FormControlLabel, Radio } from '@mui/material'

// const defaultValues = {
//   shipment_date: new Date().toISOString().slice(0, 10),
//   person_shipping: null,
//   delivery_mode: 'Shipped',
//   vehicle_no: null,
//   receiver_name: null,
//   phone_number: null,
//   name: ''
// }

// const CustomInput = forwardRef(({ ...props }, ref) => {
//   return <TextField fullWidth inputRef={ref} {...props} />
// })

// const ShipRequest = ({ dispatchedItems, storeDetails, close }) => {
//   // ** Hooks
//   const [submitLoader, setSubmitLoader] = useState(false)
//   const [total, setTotal] = useState(0)
//   const [options, setOptions] = useState([])
//   const [sort, setSort] = useState('desc')
//   const [rows, setRows] = useState([])
//   const [searchValue, setSearchValue] = useState('')
//   const [sortColumn, setSortColumn] = useState('id')
//   const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })

//   const { selectedPharmacy } = usePharmacyContext()

//   const [deliveryType, setDeliveryType] = useState({
//     pickUp: false,
//     Ship: true
//   })

//   const [openSnackbar, setOpenSnackbar] = useState({
//     open: false,
//     severity: '',
//     message: ''
//   })
//   const [date, setDate] = useState(new Date())

//   const schema = deliveryType.Ship
//     ? yup.object().shape({
//         person_shipping: yup
//           .string()
//           .min(3, 'Person Shipping Info must be at least 3 characters')
//           .required('Person Shipping Info is required'),
//         shipment_date: yup.string().required('Shipment Date is required'),

//         // vehicle_no: yup.string().required('Vehicle Number is required'),
//         phone_number: yup
//           .number()
//           .required('Mobile Number is required')
//           .test('is-valid-number', 'Mobile Number must be exactly 10 digits', value => {
//             return /^\d{10}$/.test(value)
//           })
//       })
//     : yup.object().shape({
//         receiver_name: yup
//           .string()
//           .min(3, 'Person Receiving Info must be at least 3 characters')
//           .required('Person Receiving  Info is required'),
//         shipment_date: yup.string().required('Shipment Date is required'),
//         phone_number: yup
//           .number()
//           .required('Mobile Number is required')
//           .test('is-valid-number', 'Mobile Number must be exactly 10 digits', value => {
//             return /^\d{10}$/.test(value)
//           })
//       })

//   const {
//     reset,
//     control,
//     handleSubmit,
//     setValue,
//     formState: { errors }
//   } = useForm({
//     defaultValues,
//     resolver: yupResolver(schema),
//     shouldUnregister: false,
//     mode: 'onChange',
//     reValidateMode: 'onChange'
//   })

//   const router = useRouter()
//   const { id, action } = router.query

//   const getDriverList = useCallback(
//     async (sort, q, column) => {
//       try {
//         const params = {
//           sort,
//           q,
//           column,
//           page: paginationModel.page + 1,
//           limit: paginationModel.pageSize
//         }

//         await getDrivers({ params: params }).then(res => {
//           setTotal(parseInt(res?.data?.total_count))
//           setOptions(res?.data?.list_items)
//           setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
//         })
//       } catch (e) {
//         console.error(e)
//       }
//     },
//     [paginationModel]
//   )

//   const searchDriver = useCallback(
//     debounce(async (sort, q, column) => {
//       setSearchValue(q)
//       try {
//         await getDriverList(sort, q, column)
//       } catch (error) {
//         console.error(error)
//       }
//     }, 1000),
//     []
//   )

//   const shipRequest = async payload => {
//     try {
//       setSubmitLoader(true)

//       const response = await shipRequestedItems(payload)
//       if (response?.success) {
//         setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'success' })
//         setSubmitLoader(false)
//         reset(defaultValues)
//         // close()
//         Router.back()
//       } else {
//         setSubmitLoader(false)
//         setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'error' })
//       }
//     } catch (e) {
//       console.log(e)
//       setSubmitLoader(false)
//       setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
//     }
//   }

//   useEffect(() => {
//     getDriverList(sort, searchValue, sortColumn)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [getDriverList])

//   const onSubmit = async params => {
//     setSubmitLoader(true)

//     const { person_shipping, vehicle_no, receiver_name, phone_number } = {
//       ...params
//     }

//     const shipmentDate = Utility.formatDate(date)

//     const payload = []

//     dispatchedItems?.forEach((value, index) => {
//       const payloadItem = {}
//       payloadItem.dispatch_item_id = value.dispatch_item_id
//       payloadItem.dispatch_id = value.dispatch_id
//       payloadItem.shipment_date = shipmentDate
//       payloadItem.person_shipping = person_shipping
//       payloadItem.receiver_name = receiver_name
//       payloadItem.status = deliveryType.Ship ? 'Shipped' : 'PickedUp'
//       payloadItem.to_store_id = storeDetails.to_store_id
//       payloadItem.from_store_id = storeDetails.from_store_id
//       payloadItem.vehicle_no = vehicle_no
//       payloadItem.phone_number = phone_number

//       payload.push(payloadItem)
//     })

//     // console.log('payload', payload)

//     shipRequest(payload)
//   }

//   const CustomInput = forwardRef(({ ...props }, ref) => {
//     return (
//       <TextField
//         inputRef={ref}
//         {...props}
//         sx={{ width: '100%' }}
//         InputProps={{
//           autoComplete: 'off'
//         }}
//       />
//     )
//   })

//   const columns = [
//     {
//       flex: 0.05,
//       Width: 40,
//       field: 'id',
//       headerName: 'Id',
//       renderCell: (params, rowId) => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.id}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.2,
//       Width: 40,
//       field: 'medicin_name',
//       headerName: 'Product Name',
//       renderCell: (params, rowId) => (
//         <div>
//           {/* <Typography variant='body2' sx={{ color: 'text.primary' }}>
//             {params.row.medicin_name}
//           </Typography> */}
//           <Tooltip title={params.row.medicin_name} placement='top'>
//             <Typography variant='body2' sx={{ color: 'text.primary' }}>
//               {params.row.medicin_name}
//             </Typography>
//           </Tooltip>
//         </div>
//       )
//     },
//     {
//       flex: 0.2,
//       minWidth: 20,
//       field: 'from_store_name',
//       headerName: 'Shipped from ',
//       renderCell: params => (
//         <div>
//           <Tooltip title={params.row.from_store_name} placement='top'>
//             <Typography variant='body2' sx={{ color: 'text.primary' }}>
//               {params.row.from_store_name}
//             </Typography>
//           </Tooltip>
//         </div>
//       )
//     },

//     {
//       flex: 0.2,
//       minWidth: 20,
//       field: 'to_store_name',
//       headerName: 'Shipped to',
//       renderCell: params => (
//         <div>
//           <Tooltip title={params.row.to_store_name} placement='top'>
//             <Typography variant='body2' sx={{ color: 'text.primary' }}>
//               {params.row.to_store_name}
//             </Typography>
//           </Tooltip>
//         </div>
//       )
//     },
//     {
//       flex: 0.2,
//       minWidth: 20,
//       field: 'batch_no',
//       headerName: 'Batch no',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.batch_no}
//         </Typography>
//       )
//     },

//     // {
//     //   flex: 0.1,
//     //   minWidth: 100,
//     //   field: 'Package',
//     //   headerName: 'Package',
//     //   renderCell: params => (
//     //     <Tooltip title={params?.row?.package} placement='top'>
//     //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
//     //         {params?.row?.package}
//     //       </Typography>
//     //     </Tooltip>
//     //   )
//     // },
//     // {
//     //   flex: 0.1,
//     //   minWidth: 150,
//     //   field: 'manufacture',
//     //   headerName: 'Manufacturer',
//     //   renderCell: params => (
//     //     <Tooltip title={params?.row?.manufacture} placement='top'>
//     //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
//     //         {params?.row?.manufacture}
//     //       </Typography>
//     //     </Tooltip>
//     //   )
//     // },
//     {
//       flex: 0.2,
//       minWidth: 20,
//       field: 'expiry_date',
//       headerName: 'Expiry date',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {Utility.formatDisplayDate(params.row.expiry_date) === 'Invalid date'
//             ? 'NA'
//             : Utility.formatDisplayDate(params.row.expiry_date)}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.2,
//       minWidth: 20,
//       field: 'dispatch_qty',
//       headerName: 'Dispatch qty',
//       type: 'number',
//       align: 'right',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.dispatch_qty}
//         </Typography>
//       )
//     }

//     // {
//     //   flex: 0.2,
//     //   minWidth: 20,
//     //   field: 'dispatch_status',
//     //   headerName: 'Status',
//     //   renderCell: params => (
//     //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
//     //       {params.row.dispatch_status}
//     //     </Typography>
//     //   )
//     // }
//   ]

//   const handleDeliveryTypeChange = type => {
//     if (type === 'Ship') {
//       setDeliveryType({ ...deliveryType, Ship: true, pickUp: false })
//       setValue('receiver_name', '')
//       setValue('delivery_mode', 'Shipped')
//       setValue('name', '')
//       setValue('phone_number', '')
//       setValue('vehicle_no', '')
//     } else {
//       setDeliveryType({ ...deliveryType, Ship: false, pickUp: true })
//       setValue('vehicle_no', '')
//       setValue('person_shipping', '')
//       setValue('delivery_mode', 'PickedUp')
//       setValue('name', '')
//       setValue('phone_number', '')
//     }
//   }

//   return (
//     <>
//       <Grid container spacing={6} className='match-height'>
//         <Grid item xs={12}>
//           <CardContent>
//             {/* {dispatchedItems?.length > 0 ? (
//            <Grid md={12} sm={12} xs={12} sx={{ mb: 14 }}>
//              <TableBasic columns={columns} rows={dispatchedItems}></TableBasic>
//            </Grid>
//          ) : null} */}

//             {/* <Grid md={12} sm={12} xs={12} sx={{ my: 6 }}>
//            <FormControlLabel
//              value={deliveryType.Ship}
//              label='Ship'
//              control={
//                <Radio
//                  onChange={() => {
//                    handleDeliveryTypeChange('Ship')
//                  }}
//                  checked={deliveryType.Ship}
//                  sx={deliveryType.Ship ? { color: 'error.main' } : null}
//                />
//              }
//            />
//            <FormControlLabel
//              value={deliveryType.pickUp}
//              label='Pickup'
//              control={
//                <Radio
//                  onChange={() => {
//                    handleDeliveryTypeChange('pickUp')
//                  }}
//                  checked={deliveryType.pickUp}
//                  sx={deliveryType.pickUp ? { color: 'error.main' } : null}
//                />
//              }
//            />
//          </Grid> */}
//             <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <CardHeader
//                   avatar={
//                     <Icon
//                       style={{ cursor: 'pointer' }}
//                       onClick={() => {
//                         Router.back()
//                       }}
//                       icon='ep:back'
//                     />
//                   }
//                   title={`Shipment`}
//                   action={
//                     selectedPharmacy?.type === 'local' &&
//                     storeDetails?.status === 'request' &&
//                     storeDetails?.is_modified !== '1' ? (
//                       <Button
//                         size='big'
//                         variant='contained'
//                         onClick={() => {
//                           handleRequestEdit()
//                         }}
//                       >
//                         Edit
//                       </Button>
//                     ) : (
//                       <></>
//                     )
//                   }
//                   sx={{ p: 0 }}
//                 />
//                 <Grid>
//                   <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
//                     Submit
//                   </LoadingButton>
//                   {openSnackbar.open ? (
//                     <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
//                   ) : null}
//                 </Grid>
//               </Box>
//               <Grid container sx={{ my: 6 }}>
//                 <Grid md={3} sm={12} xs={12}>
//                   <Typography sx={{ color: '#44544ADE', fontWeight: 500, fontSize: '1rem' }}> Shipped To:</Typography>
//                   <Typography sx={{ color: '#7A8684', fontWeight: 400, fontSize: '1rem', py: 2 }}>Joy Local</Typography>
//                 </Grid>
//                 <Grid md={7} sm={12} xs={12}>
//                   <Typography sx={{ color: '#44544ADE', fontWeight: 500, fontSize: '1rem' }}>Delivery Type</Typography>
//                   <FormControlLabel
//                     value={deliveryType.Ship}
//                     label='Ship'
//                     control={
//                       <Radio
//                         onChange={() => {
//                           handleDeliveryTypeChange('Ship')
//                         }}
//                         checked={deliveryType.Ship}
//                         sx={deliveryType.Ship ? { color: 'error.main' } : null}
//                       />
//                     }
//                   />
//                   <FormControlLabel
//                     value={deliveryType.pickUp}
//                     label='Pickup'
//                     control={
//                       <Radio
//                         onChange={() => {
//                           handleDeliveryTypeChange('pickUp')
//                         }}
//                         checked={deliveryType.pickUp}
//                         sx={deliveryType.pickUp ? { color: 'error.main' } : null}
//                       />
//                     }
//                   />
//                 </Grid>
//               </Grid>

//               <Grid container spacing={5}>
//                 {deliveryType.Ship ? (
//                   <Grid item xs={12} sm={6}>
//                     <FormControl fullWidth>
//                       <Controller
//                         name='name'
//                         control={control}
//                         render={({ field: { value, onChange } }) => (
//                           <Autocomplete
//                             options={options}
//                             value={value}
//                             renderOption={(props, option) => (
//                               <li {...props}>
//                                 <Box>
//                                   <Typography>{option.driver_name}</Typography>
//                                   <Typography variant='body2'>{option.phone_number}</Typography>
//                                   <Typography variant='body2'>{option.vehicle_number}</Typography>
//                                 </Box>
//                               </li>
//                             )}
//                             getOptionLabel={option => (option.driver_name ? option.driver_name : '')}
//                             isOptionEqualToValue={(option, value) => option.value === value.driver_name}
//                             onChange={(e, val) => {
//                               if (val === null) {
//                                 setValue('person_shipping', '')
//                                 setValue('vehicle_no', '')
//                                 setValue('receiver_name', '')
//                                 setValue('phone_number', '')

//                                 return onChange(null)
//                               } else {
//                                 setValue('person_shipping', val.driver_name)
//                                 setValue('vehicle_no', val.vehicle_number)
//                                 setValue('receiver_name', val.driver_name)
//                                 setValue('phone_number', val.phone_number)

//                                 return onChange(val)
//                               }
//                             }}
//                             onBlur={e => {}}
//                             onKeyUp={e => {
//                               searchDriver(sort, e.target.value, sortColumn)
//                             }}
//                             renderInput={params => (
//                               <TextField
//                                 {...params}
//                                 label='Search & Select the Driver'
//                                 error={Boolean(errors.product)}
//                                 helperText={errors.product?.message}
//                               />
//                             )}
//                           />
//                         )}
//                       />
//                     </FormControl>
//                   </Grid>
//                 ) : null}

//                 <Grid item xs={12} sm={6}>
//                   <FormControl fullWidth>
//                     <SingleDatePicker
//                       fullWidth
//                       width={'100%'}
//                       date={date}
//                       value={date}
//                       name={'Shipment Date*'}
//                       label='Shipment Date*'
//                       placeholderText={'Shipment Date*'}
//                       onChangeHandler={date => {
//                         // console.log(date)
//                         setDate(date)
//                       }}
//                       customInput={<CustomInput label='Shipment Date*' auto />}
//                     />
//                     {errors.shipment_date && (
//                       <FormHelperText sx={{ color: 'error.main' }}>Shipment Date is required</FormHelperText>
//                     )}
//                   </FormControl>
//                 </Grid>
//                 {deliveryType.Ship ? (
//                   <>
//                     <Grid item xs={12} sm={6}>
//                       <FormControl fullWidth>
//                         <Controller
//                           name='vehicle_no'
//                           control={control}
//                           rules={{ required: true }}
//                           render={({ field: { value, onChange } }) => (
//                             <TextField
//                               value={value}
//                               label='Vehicle Number'
//                               onChange={onChange}
//                               placeholder=''
//                               error={Boolean(errors.vehicle_no)}
//                               name='vehicle_no'
//                               InputLabelProps={{ shrink: true }}
//                             />
//                           )}
//                         />
//                         {errors.vehicle_no && (
//                           <FormHelperText sx={{ color: 'error.main' }}>{errors.vehicle_no.message}</FormHelperText>
//                         )}
//                       </FormControl>
//                     </Grid>

//                     <Grid item xs={12} sm={6}>
//                       <FormControl fullWidth>
//                         <Controller
//                           name='person_shipping'
//                           control={control}
//                           rules={{ required: true }}
//                           render={({ field: { value, onChange } }) => (
//                             <TextField
//                               value={value}
//                               label='Person Shipping*'
//                               onChange={onChange}
//                               placeholder=''
//                               error={Boolean(errors.person_shipping)}
//                               name='person_shipping'
//                               InputLabelProps={{ shrink: true }}
//                             />
//                           )}
//                         />
//                         {errors.person_shipping && (
//                           <FormHelperText sx={{ color: 'error.main' }}>{errors.person_shipping.message}</FormHelperText>
//                         )}
//                       </FormControl>
//                     </Grid>
//                   </>
//                 ) : (
//                   <Grid item xs={12} sm={6}>
//                     <FormControl fullWidth>
//                       <Controller
//                         name='receiver_name'
//                         control={control}
//                         rules={{ required: true }}
//                         render={({ field: { value, onChange } }) => (
//                           <TextField
//                             value={value}
//                             label='Receiver Name*'
//                             onChange={onChange}
//                             placeholder=''
//                             error={Boolean(errors.receiver_name)}
//                             name='receiver_name'
//                             InputLabelProps={{ shrink: true }}
//                           />
//                         )}
//                       />
//                       {errors.receiver_name && (
//                         <FormHelperText sx={{ color: 'error.main' }}>{errors.receiver_name.message}</FormHelperText>
//                       )}
//                     </FormControl>
//                   </Grid>
//                 )}

//                 {/* <Grid item xs={12} sm={6}>
//                <FormControl fullWidth>
//                  <Controller
//                    name='delivery_mode'
//                    control={control}
//                    rules={{ required: true }}
//                    render={({ field: { value, onChange } }) => (
//                      <TextField
//                        value={value}
//                        label='Delivery Mode*'
//                        onChange={onChange}
//                        placeholder=''
//                        error={Boolean(errors.delivery_mode)}
//                        name='delivery_mode'
//                      />
//                    )}
//                  />
//                  {errors.delivery_mode && (
//                    <FormHelperText sx={{ color: 'error.main' }}>{errors.delivery_mode.message}</FormHelperText>
//                  )}
//                </FormControl>
//              </Grid> */}

//                 <Grid item xs={12} sm={6}>
//                   <FormControl fullWidth>
//                     <Controller
//                       name='phone_number'
//                       control={control}
//                       rules={{ required: true }}
//                       render={({ field: { value, onChange } }) => (
//                         <TextField
//                           value={value}
//                           label='Mobile number*'
//                           onChange={onChange}
//                           placeholder=''
//                           error={Boolean(errors.phone_number)}
//                           name='phone_number'
//                           InputLabelProps={{ shrink: true }}
//                         />
//                       )}
//                     />
//                     {errors.phone_number && (
//                       <FormHelperText sx={{ color: 'error.main' }}>{errors.phone_number.message}</FormHelperText>
//                     )}
//                   </FormControl>
//                 </Grid>

//                 {/* <Grid item xs={12}>
//                <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
//                  Submit
//                </LoadingButton>
//                {openSnackbar.open ? (
//                  <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
//                ) : null}
//              </Grid> */}
//               </Grid>
//             </form>
//             <Box sx={{ mt: 6 }}>
//               {dispatchedItems?.length > 0 ? (
//                 <Grid md={12} sm={12} xs={12} sx={{ mb: 14 }}>
//                   <TableBasic columns={columns} rows={dispatchedItems}></TableBasic>
//                 </Grid>
//               ) : null}
//             </Box>
//           </CardContent>
//         </Grid>
//       </Grid>
//     </>
//   )
// }

// export default ShipRequest
