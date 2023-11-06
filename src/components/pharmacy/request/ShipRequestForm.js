import React, { useState, useEffect, forwardRef } from 'react'
import DatePicker from 'react-datepicker'

// ** MUI Imports

import {
  Grid,
  styled,
  Button,
  Card,
  Radio,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  FormLabel,
  CardHeader,
  InputLabel,
  IconButton,
  RadioGroup,
  CardContent,
  FormControl,
  OutlinedInput,
  FormHelperText,
  InputAdornment,
  FormControlLabel,
  CircularProgress
} from '@mui/material'

import { LoadingButton } from '@mui/lab'
import Router from 'next/router'
import { useRouter } from 'next/router'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

import UserSnackbar from 'src/components/utility/snackbar'
import SingleDatePicker from 'src/components/SingleDatePicker'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import PickersComponent from 'src/components/PickersCustomInput'
import Utility from 'src/utility'
import { shipRequestedItems } from 'src/lib/api/getRequestItemsList'

const defaultValues = {
  shipment_date: new Date().toISOString().slice(0, 10),

  person_shiping: null,
  delivery_mode: null,
  vehicle_number: null
}

const schema = yup.object().shape({
  person_shiping: yup.string().required('Person Shipping Info is required'),
  shipment_date: yup.string().required('Shipment Date is required'),
  delivery_mode: yup.string().required('Delivery Mode is required'),
  vehicle_number: yup.string().required('Vehicle Number is required')
})

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField fullWidth inputRef={ref} {...props} />
})

const ShipRequest = ({ dispatchedItems, storeDetails, close }) => {
  // ** Hooks
  const {
    reset,
    control,
    handleSubmit,
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

  const [statesList, setStatesList] = useState([])
  const [loader, setLoader] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })
  const [date, setDate] = useState(new Date())

  const shipRequest = async payload => {
    console.log(JSON.stringify(payload))

    try {
      setSubmitLoader(true)

      console.log(JSON.stringify(payload))

      const response = await shipRequestedItems(payload)
      debugger
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'success' })
        setSubmitLoader(false)
        reset(defaultValues)
        close()
      } else {
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message?.name, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  // useEffect(() => {
  //   getStatesList()
  //   if (id != undefined && action === 'edit') {
  //     getSupplier(id)
  //   }
  // }, [id, action])

  const onSubmit = async params => {
    setSubmitLoader(true)

    const { person_shiping, delivery_mode, vehicle_number } = {
      ...params
    }

    const shipmentDate = Utility.formatDate(date)

    const payload = []

    dispatchedItems?.dispatch_items?.forEach((value, index) => {
      const payloadItem = {}
      payloadItem.dispatch_id = value.id
      payloadItem.shipment_date = shipmentDate
      payloadItem.person_shiping = person_shiping
      payloadItem.status = delivery_mode
      payloadItem.to_store_id = storeDetails.to_store_id
      payloadItem.from_store_id = storeDetails.from_store_id
      payloadItem.vehicle_number = vehicle_number
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
        InputProps={{
          autoComplete: 'off'
        }}
      />
    )
  })

  return (
    <>
      <Grid container spacing={6} className='match-height'>
        <Grid item xs={12}>
          <CardContent>
            <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <SingleDatePicker
                      fullWidth
                      width={'100%'}
                      date={date}
                      value={date}
                      name={'Shipment Date*'}
                      label='Shipment Date*'
                      placeholderText={'Shipment Date*'}
                      onChangeHandler={date => {
                        console.log(date)
                        setDate(date)
                      }}
                      customInput={<CustomInput label='Shipment Date*' auto />}
                    />
                    {errors.shipment_date && (
                      <FormHelperText sx={{ color: 'error.main' }}>Shipment Date is required</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='vehicle_number'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          label='Vechicle Number*'
                          onChange={onChange}
                          placeholder=''
                          error={Boolean(errors.vehicle_number)}
                          name='vehicle_number'
                        />
                      )}
                    />
                    {errors.vehicle_number && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.vehicle_number.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <Controller
                      name='person_shiping'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          value={value}
                          label='Person Shipping*'
                          onChange={onChange}
                          placeholder=''
                          error={Boolean(errors.person_shiping)}
                          name='person_shiping'
                        />
                      )}
                    />
                    {errors.person_shiping && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.person_shiping.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel error={Boolean(errors?.delivery_mode)} id='delivery_mode'>
                      Delivery Mode*
                    </InputLabel>
                    <Controller
                      name='delivery_mode'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <Select
                          name='delivery_mode'
                          value={value}
                          label='Delivery Mode*'
                          onChange={onChange}
                          error={Boolean(errors?.delivery_mode)}
                          labelId='delivery_mode'
                        >
                          <MenuItem value={'Shipped'}>Shipped</MenuItem>
                          <MenuItem value={'Delivered'}>Delivered</MenuItem>
                          {/* {statesList?.map((item, index) => (
                        <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                          {item?.name}
                        </MenuItem>
                      ))} */}
                        </Select>
                      )}
                    />
                    {errors?.delivery_mode && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.delivery_mode?.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
                    Submit
                  </LoadingButton>
                  {openSnackbar.open ? (
                    <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
                  ) : null}
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Grid>
      </Grid>
    </>
  )
}

export default ShipRequest
