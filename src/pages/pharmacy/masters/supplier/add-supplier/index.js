import React, { useState, useEffect } from 'react'

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

import toast from 'react-hot-toast'

import { addSuppliers } from 'src/lib/api/pharmacy/addSupplier'
import { getStates } from 'src/lib/api/pharmacy/getStates'
import { getSupplierById, updateSuppliersById } from 'src/lib/api/pharmacy/getSupplierList'

// import UserSnackbar from 'src/components/utility/snackbar'
import Utility from 'src/utility'

const AddSupplier = ({ supplierDialog, closeSupplierDialog }) => {
  const defaultValues = {
    name: '',
    company_name: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    gst_number: '',
    state_id: '',
    opening_balance: 0,
    description: ''
  }

  const schema = yup.object().shape({
    company_name: yup
      .string()
      .required('Supplier name is required')

      .matches(/^[a-zA-Z0-9\s]+$/, 'Invalid Supplier name format')
      .min(3, 'Supplier name must be at least 3 characters')
      .max(50, 'Supplier name must be at most 50 characters'),

    // email: yup.string().email('Enter valid email').nullable(),
    email: yup.string().test('valid-email', 'Invalid email format', function (value) {
      if (!value) {
        return true // Email is not required, so no validation needed
      }

      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      return regex.test(value)
    }),
    phone: yup
      .string()
      .nullable()
      .test('valid-phone', 'Enter valid phone number', function (value) {
        if (!value) {
          return true
        }
        const regex = /^[6-9]\d{9}$/

        return regex.test(value)
      }),

    // .matches(
    //   /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
    //   'Enter valid phone number',
    // )
    // .max(10, 'Maximum of 10 digits')
    // .nullable(),
    mobile: yup
      .string()
      .required('Mobile No is required')
      .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Mobile number')
      .max(10, 'Maximum of 10 digits'),
    state_id: yup.string().required('State is required'),
    gst_number: yup
      .string()
      .nullable()
      .test('valid-gst', 'Enter valid GST number', function (value) {
        if (!value) {
          return true
        }
        const regex = /^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1})$/

        return regex.test(value)
      }),

    // due_balance: yup.string().required('Enter due balance'),

    opening_balance: yup.string().nullable(),
    address: yup.string().nullable(),
    description: yup.string().nullable(),
    name: yup.string().nullable()
  })

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
    mode: 'onBlur',
    reValidateMode: 'onBlur'
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

  const getStatesList = async () => {
    try {
      setLoader(true)
      const response = await getStates({ params: { sort: 'asc', column: 'name' } })

      console.log(response)
      if (response?.data?.list_items?.length > 0) {
        setStatesList(response?.data?.list_items)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getSupplier = async id => {
    try {
      setLoader(true)
      const response = await getSupplierById(id)

      if (response != undefined) {
        reset(response)
      }
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getStatesList()
    if (id != undefined && action === 'edit' && supplierDialog !== true) {
      getSupplier(id)
    }
  }, [id, action])

  const onSubmit = async params => {
    setSubmitLoader(true)

    const { name, email, phone, mobile, address, state_id, gst_number, opening_balance, description, company_name } = {
      ...params
    }

    const payload = {
      name,
      email,
      phone,
      mobile,
      address,
      state_id,
      gst_number,
      opening_balance,
      description,
      company_name
    }
    if (id !== undefined && action === 'edit' && supplierDialog !== true) {
      await updateSupplier(payload, id)
    } else {
      await addSupplerToList(payload)
    }
  }

  const updateSupplier = async (payload, id) => {
    try {
      const response = await updateSuppliersById(payload, id)
      if (response?.success) {
        // setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
        toast.success(response.data)
        setSubmitLoader(true)
        reset(defaultValues)
        Router.push('/pharmacy/masters/supplier/supplier-list')
      } else {
        setSubmitLoader(false)
        if (typeof response?.message === 'object') {
          Utility.errorMessageExtractorFromObject(response.message)

          // setOpenSnackbar({ ...openSnackbar, open: true, message: message, severity: 'error' })
        } else {
          toast.error(response.message)

          // setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'error' })
        }
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const addSupplerToList = async payload => {
    try {
      const response = await addSuppliers(payload)

      if (response?.success) {
        // setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
        toast.success(response.data)
        setSubmitLoader(true)
        reset(defaultValues)

        // This for adding supplier from the inventory page
        if (supplierDialog) {
          closeSupplierDialog()
        } else {
          Router.push('/pharmacy/masters/supplier/supplier-list')
        }
      } else {
        setSubmitLoader(false)
        if (typeof response?.message === 'object') {
          Utility.errorMessageExtractorFromObject(response.message)

          // const message = response?.message.company_name

          // setOpenSnackbar({
          //   ...openSnackbar,
          //   open: true,
          //   message: message !== '' ? 'The supplier name field must contain a unique value' : '',
          //   severity: 'error'
          // })
        } else {
          toast.error(JSON.stringify(response.message))

          // setOpenSnackbar({
          //   ...openSnackbar,
          //   open: true,
          //   message: JSON.stringify(response?.message),
          //   severity: 'error'
          // })
        }

        // setOpenSnackbar({ ...openSnackbar, open: true, message: JSON.stringify(response?.message), severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))

      // setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  // This for adding supplier from the inventory page
  // function SupplierComponent({ supplierDialog, children }) {
  //   const Tag = supplierDialog ? Grid : Card

  //   return <Card>{children}</Card>
  // }

  const supplierForm = () => {
    return (
      <>
        {supplierDialog ? null : (
          <CardHeader
            title={id ? 'Edit Supplier' : 'Add Supplier'}
            action={
              <div>
                <Button
                  size='big'
                  variant='contained'
                  onClick={() => {
                    Router.push('/pharmacy/masters/supplier/supplier-list')
                  }}
                >
                  Suppliers List
                </Button>
                {/* <span style={{ marginRight: 4 }}></span>
          <Button size='big' variant='contained' href=''>
            Upload CSV
          </Button> */}
              </div>
            }
          />
        )}
        <CardContent>
          <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
            <Grid container spacing={5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='company_name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='Supplier Name*'
                        onChange={onChange}
                        placeholder='Supplier Name'
                        error={Boolean(errors.company_name)}
                        name='company_name'
                      />
                    )}
                  />
                  {errors.company_name && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors.company_name.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField value={value} label='Contact Person' name='name' onChange={onChange} placeholder='' />
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='mobile'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextField
                        value={value}
                        label='Mobile Number*'
                        onChange={onChange}
                        placeholder=''
                        error={Boolean(errors?.mobile)}
                        onBlur={onBlur}
                        name='mobile'
                      />
                    )}
                  />
                  {errors.mobile && (
                    <FormHelperText sx={{ color: 'error.main' }}> {errors?.mobile?.message} </FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors?.state_id)} id='state_id'>
                    State*
                  </InputLabel>
                  <Controller
                    name='state_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='state_id'
                        value={value}
                        label='Select'
                        onChange={onChange}
                        error={Boolean(errors?.state_id)}
                        labelId='state_id'
                      >
                        {statesList?.map((item, index) => (
                          <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                            {item?.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors?.state_id && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.state_id?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='gst_number'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='GST Number'
                        onChange={onChange}
                        placeholder=''
                        error={Boolean(errors?.gst_number)}
                        name='gst_number'
                      />
                    )}
                  />
                  {errors?.gst_number && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.gst_number?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='email'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        type='email'
                        value={value}
                        label='Email'
                        onChange={onChange}
                        error={Boolean(errors?.email)}
                        placeholder=''
                        name='email'
                      />
                    )}
                  />
                  {errors?.email && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.email?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='phone'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='Phone'
                        onChange={onChange}
                        placeholder=''
                        error={Boolean(errors?.phone)}
                        name='phone'
                      />
                    )}
                  />
                  {errors?.phone && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.phone?.message}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='description'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='Description'
                        onChange={onChange}
                        placeholder=''
                        name='description'
                      />
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Controller
                    name='address'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => <TextField name='address' rows={4} multiline {...field} label='Address' />}
                  />
                </FormControl>
              </Grid>

              {/* <Grid item xs={12}>
            <FormControl fullWidth>
              <Controller
                name='opening_balance'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    type='number'
                    label='Opening Balance'
                    disabled={Boolean(id)}
                    onChange={onChange}
                    placeholder=''
                    name='opening_balance'
                  />
                )}
              />
            </FormControl>
          </Grid> */}

              <Grid item xs={12}>
                <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
                  Submit
                </LoadingButton>
                {/* {openSnackbar.open ? (
              <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
            ) : null} */}
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <Grid container spacing={6} className='match-height'>
        <Grid item xs={12}>
          {supplierDialog ? (
            <Grid>{supplierForm()}</Grid>
          ) : (
            <Card>
              {/* <SupplierComponent supplierDialog={supplierDialog}> */}
              {supplierForm()}
              {/* </SupplierComponent> */}
            </Card>
          )}
        </Grid>
      </Grid>
    </>
  )
}

export default AddSupplier
