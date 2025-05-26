import React, { useEffect, useState } from 'react'
import { useForm, Controller, get } from 'react-hook-form'
import {
  Grid,
  FormControl,
  Autocomplete,
  Tooltip,
  TextField,
  FormHelperText,
  Button,
  Typography,
  Paper
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// import Table from '@mui/material/Table'
// import TableRow from '@mui/material/TableRow'
// import TableHead from '@mui/material/TableHead'

// import TableCell from '@mui/material/TableCell'

import { LoaderIcon } from 'react-hot-toast'

// import ConfirmDialog from 'src/components/ConfirmationDialog'

import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'

import TableCell from '@mui/material/TableCell'
import UserSnackbar from 'src/components/utility/snackbar'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import RenderUtility from 'src/utility/render'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'

const defaultValues = {
  request_item: {
    label: '',
    value: ''
  },
  request_item_batch_no: {
    label: '',
    value: '',
    expiry_date: ''
  },
  request_item_qty: '',
  stock_type: '',
  available_item_qty: '',
  expiry_date: '',
  packageDetails: '',
  manufacture: '',
  control_substance: false,
  variant_id: '',
  multiplier: ''
}

const schema = yup.object().shape({
  request_item: yup.object().shape({
    label: yup.string().required('Product Name is required'),
    value: yup.string().required('Product Name is required')
  }),

  // request_item_batch_no: yup.object().shape({
  //   label: yup.string().required('Batch no is required'),
  //   value: yup.string().required('Batch no is required'),
  //   expiry_date: yup.string().required('Batch no is required')
  // }),
  request_item_batch_no: yup
    .mixed()
    .required('Batch number is required')
    .test('is-object-with-properties', 'Batch number is required', value => {
      return (
        value !== null && typeof value === 'object' && 'label' in value && 'value' in value && 'expiry_date' in value
      )
    }),
  request_item_qty: yup
    .number()
    .typeError('Quantity must be a number')
    .positive('Quantity must be a positive number')
    .required('Quantity is required')
    .moreThan(0, 'Quantity must be greater than zero'),

  // available_item_qty: yup.string().required('Available Quantity is required'),
  expiry_date: yup.string().required('Expiry Date is required')
})

export const AddItemsForm = ({
  searchMedicineData,
  productList,
  productLoading,
  onSubmitData,
  searchBatchData,
  batchLoading,
  batchList,
  setBatchList,
  nestedMedicine,
  error,
  totalQuantity,
  editParams,
  closeDialog
}) => {
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    setError,
    clearErrors,
    watch
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })
  const theme = useTheme()
  const [batchError, setBatchError] = useState(false)
  const [totalAvailableCount, setTotalAvailableCount] = useState(0)
  const [quantityError, setQuantityError] = useState(false)
  const [invalidQty, setInvalidQty] = useState([])
  const [invalidQtyDialog, setInvalidQtyDialog] = useState(false)

  // const [invalidQty, setInvalidQty] = useState([])
  // const [invalidQtyDialog, setInvalidQtyDialog] = useState(false)

  // const showConfirmationDialog = () => {
  //   setInvalidQtyDialog(true)
  // }

  // const closeConfirmationDialog = () => {
  //   setInvalidQtyDialog(false)
  //   setInvalidQty([])
  // }

  // console.log('nestedMedicine', nestedMedicine)
  // console.log('batchLoading', batchLoading)

  const onSubmit = async params => {
    const {
      request_item_batch_no,
      request_item_qty,
      available_item_qty,
      expiry_date,
      request_item,
      stock_type,

      packageDetails,
      manufacture,
      control_substance,
      variant_id,
      multiplier
    } = {
      ...params
    }
    const type = nestedMedicine?.uuid === '' ? 'new' : 'update'

    // console.log('params', params)

    const isMedicineAlreadyExists = editParams.request_item_details.some(
      item =>
        item?.request_item_medicine_id === request_item?.value &&
        item?.request_item_batch_no === request_item_batch_no?.value &&
        nestedMedicine?.uuid !== item?.uuid
    )

    if (isMedicineAlreadyExists) {
      setBatchError(true)
      setError('request_item_batch_no', {
        type: 'manual',
        message: 'Batch already exists'
      })
      console.log('Medicine already exists')

      // alert('2')

      return

      // alert('3')
    }

    // if (request_item_qty > available_item_qty) {
    //   setQuantityError(true)

    // const invalidItems = [
    //   {
    //     request_item_batch_no: request_item_batch_no?.value,
    //     request_item_qty,
    //     available_item_qty,
    //     expiry_date,
    //     request_item_medicine_id: request_item?.value,
    //     product_name: request_item?.label,
    //     priority_item: 'Normal',
    //     uuid: nestedMedicine?.uuid
    //   }
    // ]

    // // console.log('invalid items', invalidItems)
    // setInvalidQty(invalidItems)

    // setInvalidQtyDialog(true)

    // alert('2')

    // return

    // alert('3')
    // }

    // if (request_item_qty > available_item_qty) {
    //   const invalidItems = [
    //     {
    //       request_item_batch_no: request_item_batch_no?.value,
    //       request_item_qty,
    //       available_item_qty,
    //       expiry_date,
    //       request_item_medicine_id: request_item?.value,
    //       product_name: request_item?.label,
    //       priority_item: 'Normal',
    //       uuid: nestedMedicine?.uuid
    //     }
    //   ]

    //   // console.log('invalid items', invalidItems)
    //   setInvalidQty(invalidItems)

    //   setInvalidQtyDialog(true)

    //   return
    // }
    clearErrors('request_item_batch_no')

    if (Number(request_item_qty) > Number(available_item_qty)) {
      setQuantityError(true)

      return
    }
    console.log(totalAvailableCount <= 0)

    // if (totalAvailableCount <= 0) {
    //   setQuantityError(true)

    //   return
    // }

    onSubmitData(
      {
        request_item_batch_no: request_item_batch_no?.value,
        request_item_qty,
        available_item_qty,
        expiry_date,
        request_item_medicine_id: request_item?.value,
        product_name: request_item?.label,
        priority_item: 'Normal',
        uuid: nestedMedicine?.uuid,
        stock_type,

        packageDetails,
        manufacture,
        control_substance,
        variant_id,
        multiplier
      },
      type
    )
  }

  // const confirmDataSubmit = () => {
  //   const type = nestedMedicine?.uuid === '' ? 'new' : 'update'
  //   onSubmitData(
  //     {
  //       request_item_batch_no: invalidQty[0]?.request_item_batch_no,
  //       request_item_qty: invalidQty[0]?.request_item_qty,
  //       available_item_qty: invalidQty[0]?.available_item_qty,
  //       expiry_date: invalidQty[0]?.expiry_date,
  //       request_item_medicine_id: invalidQty[0]?.request_item_medicine_id,
  //       product_name: invalidQty[0]?.product_name,
  //       priority_item: invalidQty[0]?.priority_item,
  //       uuid: invalidQty[0]?.uuid
  //     },
  //     type
  //   )
  // }

  useEffect(() => {
    checkTotalCount()
  }, [error, totalQuantity])

  const checkTotalCount = e => {
    // console.log('editParams', editParams)
    const productId = watch('request_item')
    const quantity = watch('request_item_qty')
    var totalCount = 0
    var enteredCount = 0
    var nestedItemQuantity = 0

    if (e?.target?.value !== undefined) {
      enteredCount = isNaN(parseInt(e?.target?.value)) ? 0 : parseInt(e?.target?.value)
    } else {
      enteredCount = isNaN(parseInt(quantity)) ? 0 : parseInt(quantity)
    }

    if (productId !== undefined) {
      const filteredList = editParams?.request_item_details?.filter(
        item => item.request_item_medicine_id === productId?.value
      )
      totalCount = filteredList.reduce((acc, item) => acc + parseInt(item.request_item_qty), 0)
    }

    if (nestedMedicine.request_item_qty !== '') {
      nestedItemQuantity = nestedMedicine?.request_item_qty
    }

    const available_qty = parseInt(totalQuantity) - (totalCount - nestedItemQuantity + enteredCount)
    setTotalAvailableCount(available_qty)
  }

  // useEffect(() => {
  //   if (nestedMedicine?.id === undefined && nestedMedicine?.medicine_name !== '') {
  //     reset({
  //       request_item: {
  //         label: nestedMedicine?.medicine_name,
  //         value: nestedMedicine?.request_item_medicine_id
  //       },
  //       request_item_batch_no: {
  //         label: nestedMedicine?.request_item_batch_no,
  //         value: nestedMedicine?.request_item_batch_no,
  //         expiry_date: nestedMedicine?.expiry_date
  //       },
  //       request_item_qty: nestedMedicine?.request_item_qty,
  //       expiry_date: nestedMedicine?.expiry_date
  //     })
  //   } else {
  //   }
  // }, [])

  useEffect(() => {
    // setTotalAvailableCount(totalQuantity)

    if (error !== '') {
      setError('request_item_batch_no', {
        type: 'manual',
        message: 'Batch already exists'
      })
    }
    if (!batchLoading) {
      checkTotalCount()
    }
  }, [error, totalQuantity, batchLoading])

  // const checkTotalCount = e => {
  //   console.log('nestedMedicine', nestedMedicine)
  //

  //   // console.log('editParams', editParams)
  //   const productId = watch('request_item')
  //   const quantity = watch('request_item_qty')

  //   var totalCount = 0
  //   var enteredCount = 0
  //   var nestedItemQuantity = 0

  //   if (e?.target?.value !== undefined) {
  //     enteredCount = isNaN(parseInt(e?.target?.value)) ? 0 : parseInt(e?.target?.value)
  //   } else {
  //     enteredCount = isNaN(parseInt(quantity)) ? 0 : parseInt(quantity)
  //   }

  //   if (productId !== undefined) {
  //     const filteredList = editParams?.request_item_details?.filter(
  //       item => item.request_item_medicine_id === productId?.value
  //     )
  //     totalCount = filteredList.reduce((acc, item) => acc + parseInt(item.request_item_qty), 0)
  //   }

  //   if (nestedMedicine.request_item_qty !== '') {
  //     nestedItemQuantity = nestedMedicine?.request_item_qty
  //   }

  //   const available_qty = parseInt(totalQuantity) - (totalCount - nestedItemQuantity + enteredCount)
  //   setTotalAvailableCount(available_qty)
  // }

  useEffect(() => {
    if (nestedMedicine?.id === undefined && nestedMedicine?.medicine_name !== '') {
      reset({
        request_item: {
          label: nestedMedicine?.medicine_name,
          value: nestedMedicine?.request_item_medicine_id
        },
        request_item_batch_no: {
          label: nestedMedicine?.request_item_batch_no,
          value: nestedMedicine?.request_item_batch_no,
          expiry_date: nestedMedicine?.expiry_date
        },
        request_item_qty: nestedMedicine?.request_item_qty,
        expiry_date: nestedMedicine?.expiry_date,
        available_item_qty: nestedMedicine?.available_item_qty,
        stock_type: nestedMedicine?.stock_type,
        packageDetails: nestedMedicine?.packageDetails,
        manufacture: nestedMedicine?.manufacture,
        variant_id: nestedMedicine?.variant_id,
        multiplier: nestedMedicine?.multiplier
      })
      async function searchMedicine() {
        await searchMedicineData(nestedMedicine?.request_item_medicine_id, nestedMedicine.stock_type)
      }

      async function searchBatch() {
        await searchBatchData(nestedMedicine?.request_item_medicine_id, nestedMedicine.stock_type)
      }

      searchMedicine()
      searchBatch()

      checkTotalCount()
    } else {
    }
    checkTotalCount()
  }, [])

  return (
    <>
      {/* <CardContent> */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Grid container rowSpacing={4} columnSpacing={2} xs={12}>
          <Grid item xs={12} sm={12} lg={12}>
            <FormControl fullWidth>
              <Controller
                name='request_item'
                control={control}
                defaultValue={null}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    id='request_item'
                    options={productList}
                    getOptionLabel={option => option.label || ''}
                    value={field.value}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    onKeyUp={e => {
                      searchMedicineData(e.target.value)
                    }}
                    onChange={(e, value) => {
                      setValue('request_item', value)
                      setValue('request_item_batch_no', '')
                      setValue('expiry_date', '')
                      setValue('stock_type', '')
                      setValue('available_item_qty', '')
                      setValue('packageDetails', '')
                      setValue('manufacture', '')

                      if (value !== '' && value !== null) {
                        searchBatchData(value.value, value.stock_type)
                        setValue('stock_type', value.stock_type)
                        setValue('packageDetails', value.packageDetails)
                        setValue('manufacture', value.manufacture)
                        setValue('control_substance', value.control_substance)
                      } else {
                        setBatchList([])
                      }

                      checkTotalCount()
                    }} // Set selected value
                    onBlur={async () => {
                      await searchMedicineData(nestedMedicine?.request_item_medicine_id, nestedMedicine.stock_type)
                    }}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography
                            sx={{
                              color: 'customColors.OnSecondaryContainer',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '16px',
                              fontWeight: 400
                            }}
                          >
                            {RenderUtility?.renderControlLabel(option.control_substance === true, 'CS')}
                            {RenderUtility?.renderControlLabel(option.prescription_required === true, 'PR')}
                            {option.label}
                          </Typography>
                          <Typography variant='body2'>{option.packageDetails}</Typography>
                          <Typography variant='body2'>{option.manufacture}</Typography>
                        </Box>

                        {/* <Box>
                          <Typography>{option.label}</Typography>
                          <Typography variant='body2'>{option.packageDetails}</Typography>
                          <Typography variant='body2'>{option.manufacture}</Typography>
                        </Box> */}
                      </li>
                    )}
                    loading={productLoading}
                    noOptionsText='Type to search'
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Product Name*'
                        placeholder='Search & Select'
                        error={Boolean(errors.request_item)}
                      />
                    )}
                  />
                )}
              />
              {errors?.request_item && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item?.message}</FormHelperText>
              )}
              {/* {watch('packageDetails') && (
                <Box sx={{ mx: 1, my: 2, display: 'flex' }}>
                  <Chip
                    label={watch('packageDetails')}
                    color='primary'
                    variant='outlined'
                    size='sm'
                    sx={{ mr: 2, fontSize: 11, height: '22px' }}
                  />
                  <Chip
                    label={watch('manufacture')}
                    color='primary'
                    variant='outlined'
                    size='sm'
                    sx={{ fontSize: 11, height: '22px' }}
                  />
                </Box>
              )} */}
            </FormControl>

            {/* {totalAvailableCount ? (
              <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2 }}>
                {batchLoading ? <LoaderIcon /> : ` Total Available Quantity:${totalAvailableCount}`}
              </Typography>
            ) : null} */}

            {watch('packageDetails') && (
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: 'customColors.Surface',
                  padding: 3,
                  borderRadius: 1,

                  // border: '1px solid #37BD69',
                  border: `1px solid ${theme.palette.primary.main}`,
                  mt: 5
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}
                    >
                      Package:
                    </Typography>
                    <Typography
                      color='primary.light'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                    >
                      {watch('packageDetails')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}
                    >
                      Manufactured by:
                    </Typography>
                    <Typography
                      color='primary.light'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                    >
                      {watch('manufacture')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', mb: 1 }}
                    >
                      Availability:
                    </Typography>
                    <Typography
                      color='primary.light'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                    >
                      {batchLoading ? <LoaderIcon /> : `${totalAvailableCount}`}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} sm={12}>
            <Typography
              variant='subtitle1'
              sx={{ color: 'customColors.customTextColorGray2', fontSize: '14px', fontWeight: 500 }}
            >
              {getValues('stock_type') === 'non_medical' ? 'Batch No' : 'Batch No and Expiry Date'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={getValues('stock_type') === 'non_medical' ? 6 : 4}>
            {/* <FormControl fullWidth>
              <Controller
                name='request_item_batch_no'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    id='request_item_batch_no'
                    options={batchList === undefined ? [] : batchList}
                    getOptionLabel={option => option.label || ''}
                    value={field.value}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    onChange={(e, value) => {
                      setValue('request_item_batch_no', value)
                      setValue('expiry_date', value?.expiry_date)
                      setValue('available_item_qty', value?.available_item_qty)
                      clearErrors('request_item_batch_no')
                      checkTotalCount()
                      setQuantityError(false)
                    }}
                    loading={batchLoading}
                    noOptionsText='Type to search'
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Batch No*'
                        placeholder='Search'
                        error={Boolean(errors.request_item_batch_no)}
                      />
                    )}
                  />
                )}
              />
              {errors?.request_item_batch_no && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item_batch_no?.message}</FormHelperText>
              )}
              {getValues('available_item_qty') ? (
                <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2, my: { xs: 0, md: 1 } }}>
                  Available Quantity:{getValues('available_item_qty')}
                </Typography>
              ) : null}
            </FormControl> */}
            <FormControl fullWidth>
              <Controller
                name='request_item_batch_no'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    id='request_item_batch_no'
                    options={batchList === undefined ? [] : batchList}
                    getOptionLabel={option => option.label || ''}
                    value={field.value}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    onChange={(e, value) => {
                      setValue('request_item_batch_no', value)
                      setValue('expiry_date', value?.expiry_date)
                      setValue('available_item_qty', value?.available_item_qty),
                        setValue('multiplier', value?.multiplier)
                      setValue('variant_id', value?.variant_id)
                      clearErrors('request_item_batch_no')
                      setQuantityError(false)
                      checkTotalCount()
                    }}
                    loading={batchLoading}
                    noOptionsText='Type to search'
                    renderInput={params => (
                      <TextField
                        {...params}
                        placeholder='Enter Batch No'
                        error={Boolean(errors.request_item_batch_no)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            '& fieldset': {
                              // borderColor: '#e0e0e0'
                            }
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box
                        component='li'
                        {...props}
                        sx={{
                          border: '1px solid transparent',

                          // border: '1px solid #0000000D',
                          // borderBottom: '1px solid #e0e0e0',
                          '&:last-child': {
                            borderBottom: 'none'
                          },
                          m: 3,
                          '&:hover': {
                            // border: '1px solid #0000000D'
                            border: `1px solid ${theme.palette.customColors.neutral05}`
                          },

                          borderRadius: '2px'
                        }}
                      >
                        <Box sx={{ p: 1 }}>
                          <Typography
                            variant='body2'
                            color='customColors.customHeadingTextColor'
                            sx={{ fontWeight: 600 }}
                          >
                            {option.label}
                          </Typography>
                          <Typography variant='body2' color='customColors.neutralSecondary'>
                            Expiry Date: {Utility.formatDisplayDate(option.expiry_date)}
                          </Typography>
                          <Typography variant='body2' color='primary.main'>
                            Availability: {option.available_item_qty}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    PaperComponent={({ children, ...props }) => (
                      <Paper
                        {...props}
                        elevation={3}
                        sx={{
                          mt: 1,
                          '& .MuiAutocomplete-listbox': {
                            p: 0,
                            maxHeight: '300px'
                          }
                        }}
                      >
                        {children}
                      </Paper>
                    )}
                  />
                )}
              />
              {getValues('available_item_qty') ? (
                <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2, my: { xs: 0, md: 1 } }}>
                  Available Quantity:{getValues('available_item_qty')}
                </Typography>
              ) : null}
              {errors?.request_item_batch_no && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item_batch_no?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={getValues('stock_type') === 'non_medical' ? 6 : 4}>
            <FormControl fullWidth>
              <Controller
                name='multiplier'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    disabled
                    type='text'
                    value={value}
                    label='Product Variant'
                    name='multiplier'
                    error={Boolean(errors.multiplier)}
                    onChange={onChange}
                  />
                )}
              >
                {errors.multiplier && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.multiplier?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          {getValues('stock_type') === 'non_medical' ? null : (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <Controller
                  name='expiry_date'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Expiry Date*'
                      name='expiry_date'
                      error={Boolean(errors.expiry_date)}
                      onChange={onChange}
                      disabled
                    />
                  )}
                >
                  {errors.expiry_date && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.expiry_date?.message}</FormHelperText>
                  )}
                </Controller>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} sm={12}>
            <Typography
              variant='subtitle1'
              sx={{ color: 'customColors.customTextColorGray2', fontSize: '14px', fontWeight: 500 }}
            >
              Quantity
            </Typography>
          </Grid>
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Controller
                name='request_item_qty'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    type='number'
                    value={value}
                    label='Quantity*'
                    name='request_item_qty'
                    error={Boolean(errors.request_item_qty)}
                    onChange={onChange}
                    onKeyUP={checkTotalCount}
                    onPaste={checkTotalCount}
                    onInput={checkTotalCount}
                  />
                )}
              >
                {errors.request_item_qty && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item_qty?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          {/* {getValues('stock_type') === 'non_medical' ? null : (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Controller
                  name='expiry_date'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Expiry Date*'
                      name='expiry_date'
                      error={Boolean(errors.expiry_date)}
                      onChange={onChange}
                      disabled
                    />
                  )}
                >
                  {errors.expiry_date && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.expiry_date?.message}</FormHelperText>
                  )}
                </Controller>
              </FormControl>
            </Grid>
          )} */}
          {quantityError && (
            <Grid item xs={12}>
              <Typography color={'error.main'}>Quantity should be lesser than available Quantity.</Typography>
            </Grid>
          )}
          <Grid item xs={12} display={'flex'} justifyContent={'flex-end'} gap={4}>
            <Button variant='outlined' onClick={() => closeDialog()}>
              Cancel
            </Button>
            <Button type='submit' variant='contained'>
              Add
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  )
}
