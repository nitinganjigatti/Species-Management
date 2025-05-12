import React, { useEffect, useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  CardContent,
  Grid,
  FormControl,
  Autocomplete,
  TextField,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
  Tooltip,
  Box
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Chip from '@mui/material/Chip'

import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'

import TableCell from '@mui/material/TableCell'
import UserSnackbar from 'src/components/utility/snackbar'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import ConfirmDialogBox from 'src/components/ConfirmDialogBox'

// import Table from '@mui/material/Table'
// import TableRow from '@mui/material/TableRow'

// import TableCell from '@mui/material/TableCell'

// import TableHead from '@mui/material/TableHead'

// import ConfirmDialog from 'src/components/ConfirmationDialog'

import { LoaderIcon } from 'react-hot-toast'
import RenderUtility from 'src/utility/render'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'
import CustomChip from 'src/@core/components/mui/chip'

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
  multiplier: '',
  unit_price: ''
}

const schema = yup.object().shape({
  request_item: yup
    .object()
    .transform(value => (value === '' ? null : value))
    .shape({
      label: yup.string().required('Product Name is required'),
      value: yup.string().required('Product Name is required')
    })
    .required('Product Name is required'),

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
    .typeError('Quantity must be a positive number')
    .positive('Quantity must be a positive number')
    .integer('Quantity must be an integer')
    .required('Quantity is required'),

  // available_item_qty: yup.string().required('Available Quantity is required'),
  expiry_date: yup.string().required('Expiry Date is required')
})

export const AddItemsForm = ({
  searchMedicineData,
  productList,
  productLoading,
  visibleExpiryField,
  onSubmitData,
  searchBatchData,
  batchLoading,
  batchList,
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

  const showConfirmationDialog = () => {
    setInvalidQtyDialog(true)
  }

  const closeConfirmationDialog = () => {
    setInvalidQtyDialog(false)
    setInvalidQty([])
  }
  const [totalQtyLoader, setTotalQtyLoader] = useState(false)

  // confirm dialogbox validation
  // const [invalidQtyDialog, setInvalidQtyDialog] = useState(false)
  // const [invalidQty, setInvalidQty] = useState([])

  // const showConfirmationDialog = () => {
  //   setInvalidQtyDialog(true)
  // }

  // const closeConfirmationDialog = () => {
  //   setInvalidQtyDialog(false)
  //   setInvalidQty([])
  // }

  console.log(batchList, 'list')

  const onSubmit = async params => {
    console.log(params, 'params')

    setBatchError(false)

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
      multiplier,
      unit_price
    } = {
      ...params
    }

    const type = nestedMedicine?.uuid === '' ? 'new' : 'update'

    const isMedicineAlreadyExists = editParams?.request_item_details?.some(
      item =>
        item.request_item_medicine_id === request_item.value &&
        item.request_item_batch_no === request_item_batch_no.value &&
        nestedMedicine?.uuid !== item.uuid
    )

    if (isMedicineAlreadyExists) {
      setBatchError(true)
      setError('request_item_batch_no', {
        type: 'manual',
        message: 'Batch already exists'
      })
      console.log('Medicine already exists')

      return
    }

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

    //   setInvalidQty(invalidItems)

    //   setInvalidQtyDialog(true)

    //   return
    // }
    if (Number(request_item_qty) > Number(available_item_qty)) {
      setQuantityError(true)

      return
    }

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

    //   setInvalidQty(invalidItems)

    //   setInvalidQtyDialog(true)

    //   return
    // }
    clearErrors('request_item_batch_no')

    // if (totalAvailableCount < 0) {
    //   setQuantityError(true)

    //   return
    // }

    onSubmitData(
      {
        request_item_batch_no: request_item_batch_no.value,
        request_item_qty,
        available_item_qty,
        expiry_date,
        request_item_medicine_id: request_item.value,
        product_name: request_item.label,
        priority_item: 'Normal',
        uuid: nestedMedicine?.uuid,
        stock_type,
        packageDetails,
        manufacture,
        control_substance,
        variant_id,
        multiplier,
        unit_price

        // to_store_id: '14'
      },
      type
    )
  }

  const checkTotalCount = async e => {
    // console.log('nestedMedicine', nestedMedicine)

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

  useEffect(() => {
    checkTotalCount()
  }, [totalQuantity])

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
    console.log('available_item_qty in nested ', nestedMedicine)
    if (nestedMedicine?.id === undefined && nestedMedicine?.medicine_name !== '' && nestedMedicine?.uuid !== '') {
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
        multiplier: nestedMedicine?.multiplier,
        unit_price: nestedMedicine?.unit_price
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

  console.log(productList, 'productList')

  return (
    <>
      {/* <CardContent> */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Grid container rowSpacing={4} columnSpacing={2} sm={12} xs={12}>
          <Grid item xs={12} sm={12} lg={12}>
            <FormControl fullWidth>
              <Controller
                name='request_item'
                control={control}
                defaultValue={null}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    id='request_item'
                    options={productList}
                    getOptionLabel={option => option.label || ''}
                    value={value}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    onKeyUp={e => {
                      searchMedicineData(e.target.value)
                    }}
                    onChange={(e, value) => {
                      setValue('request_item', value, { shouldValidate: true })
                      setValue('request_item_batch_no', '', { shouldValidate: true })
                      setValue('expiry_date', '', { shouldValidate: true })
                      setValue('available_item_qty', '')
                      setValue('stock_type', '')
                      setValue('packageDetails', '')
                      setValue('manufacture', '')
                      setValue('unit_price', '')

                      if (value === null || value.status === 0) {
                        return onChange(null)
                      } else if (value !== '' && value !== null) {
                        setQuantityError(false)
                        searchBatchData(value.value, value.stock_type)
                        setValue('stock_type', value.stock_type)
                        setValue('packageDetails', value.packageDetails)
                        setValue('manufacture', value.manufacture)
                        setValue('control_substance', value.control_substance)
                        setValue('unit_price', value.unit_price)
                      } else {
                      }
                      checkTotalCount()
                    }} // Set selected value
                    onBlur={async () => {
                      await searchMedicineData(nestedMedicine?.request_item_medicine_id, nestedMedicine.stock_type)
                    }}
                    renderOption={(props, option) => (
                      <li
                        {...props}
                        style={{ opacity: option.status ? 1 : 0.5, pointerEvents: option.status ? 'auto' : 'none' }}
                      >
                        <Box>
                          {/* <Typography
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
                          </Typography> */}
                          <Typography>{option.label}</Typography>
                          {/* <Typography>{option.label}</Typography> */}
                          <Typography variant='body2'>{option.packageDetails}</Typography>
                          <Typography variant='body2'>{option.manufacture}</Typography>
                          {RenderUtility?.renderControlLabel(option.control_substance === true, 'CS')}
                          {/* {option.control_substance === true && (
                            <CustomChip label='CS' skin='light' color='success' size='small' />
                          )}{' '} */}
                          {option.prescription_required === true && (
                            <CustomChip label='PR' skin='light' color='success' size='small' />
                          )}
                        </Box>
                      </li>
                    )}
                    loading={productLoading}
                    noOptionsText='Type to search'
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Search by Product Name*'
                        placeholder='Search & Select'
                        error={Boolean(errors.request_item)}
                      />
                    )}
                  />
                )}
              />
              {errors?.request_item && (
                <FormHelperText sx={{ color: 'error.main' }}>
                  {errors?.request_item?.value?.message || errors?.request_item?.message}
                </FormHelperText>
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
              {/* <Box>
                <Typography>{option.name}</Typography>
                <Typography variant='body2'>{option.package}</Typography>
                <Typography variant='body2'>{option.manufacture}</Typography>
                {option.control_substance === true && (
                  <CustomChip label='CS' skin='light' color='success' size='small' />
                )}{' '}
                {option.prescription_required === true && (
                  <CustomChip label='PR' skin='light' color='success' size='small' />
                )}
              </Box> */}
            </FormControl>
            {/* {watch('packageDetails') && (
              <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2 }}>
                {batchLoading ? <LoaderIcon /> : ` Total Available Quantity:${totalAvailableCount}`}
              </Typography>
            )} */}

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
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px' }}
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
                  <Box
                    sx={{
                      backgroundColor: 'customColors.OnPrimaryContainer',
                      borderRadius: '16px',
                      padding: '5px 15px',
                      width: 'fit-content',
                      color: 'customColors.OnPrimary'
                    }}
                  >
                    <Typography
                      variant='body1'
                      component='span'
                      sx={{
                        fontSize: '12px',
                        fontWeight: 400,
                        color: 'customColors.OnPrimary'
                      }}
                    >
                      Unit Price -{' '}
                      {watch('unit_price') == null || watch('unit_price') == '0'
                        ? Utility.formatAmountToReadableDigit('0')
                        : Utility.formatAmountToReadableDigit(watch('unit_price'))}
                    </Typography>
                  </Box>

                  {/* <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px' }}
                    >
                      Unit Price:
                    </Typography>
                    <Typography sx={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}>
                      {Utility.formatAmountToReadableDigit(watch('unit_price'))}
                    </Typography>
                    <Typography
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px', marginLeft: '8px' }}
                    >
                      Total Value:
                    </Typography>
                    <Typography sx={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}>
                      {Utility.formatAmountToReadableDigit(watch('unit_price') * watch('request_item_qty')) || 0}
                    </Typography>
                  </Box> */}
                </Box>
              </Paper>
            )}
          </Grid>
          <Grid item xs={12} sm={12}>
            <Typography variant='subtitle1'>
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
                      // console.log('value', value)
                      // setValue('request_item', value)
                      setValue('request_item_batch_no', value)
                      setValue('expiry_date', value?.expiry_date)
                      setValue('available_item_qty', value?.available_item_qty)
                      clearErrors('request_item_batch_no')
                      setQuantityError(false)
                      checkTotalCount()
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
            {/* {getValues('available_item_qty') ? (
              <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2, my: { xs: 0, md: 1 } }}>
                Available Quantity:{getValues('available_item_qty')}
              </Typography>
            ) : null} */}

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
                      setValue('expiry_date', value?.expiry_date, { shouldValidate: true })
                      setValue('available_item_qty', value?.available_item_qty)
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
                        label={Boolean(errors.request_item_batch_no) ? 'Enter Batch No*' : 'Enter Batch No'}
                        error={Boolean(errors.request_item_batch_no)}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box
                        component='li'
                        {...props}
                        sx={{
                          border: '1px solid transparent',
                          '&:last-child': {
                            borderBottom: 'none'
                          },
                          m: 3,
                          '&:hover': {
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
              {errors?.request_item_batch_no && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item_batch_no?.message}</FormHelperText>
              )}
              {getValues('available_item_qty') ? (
                <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2, my: { xs: 0, md: 1 } }}>
                  Available Quantity:{getValues('available_item_qty')}
                </Typography>
              ) : null}
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
                      variant='outlined'
                      slotProps={{
                        textField: {
                          error: Boolean(errors.expiry_date)
                        }
                      }}
                      inputProps={{ disabled: true }}
                    />
                  )}
                />
                {errors.expiry_date && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.expiry_date?.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          )}
          {getValues('stock_type') === 'non_medical' ? null : (
            <Grid item xs={12} sm={12}>
              <Typography variant='subtitle1'> Quantity</Typography>
            </Grid>
          )}

          <Grid item xs={12} sm={getValues('stock_type') === 'non_medical' ? 6 : 12}>
            <FormControl fullWidth>
              <Controller
                name='request_item_qty'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Quantity*'
                    name='request_item_qty'
                    error={Boolean(errors.request_item_qty)}
                    onChange={onChange}
                    onKeyDown={checkTotalCount}
                    onPaste={checkTotalCount}
                    onInput={checkTotalCount}
                  />
                )}
              />
              {errors.request_item_qty && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item_qty?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12}>
            <Box
              sx={{
                backgroundColor: 'customColors.Surface',
                borderRadius: '16px',
                padding: '5px 15px',
                width: 'fit-content',

                border: `1px solid ${theme.palette.primary.main}`
              }}
            >
              <Typography
                variant='body1'
                component='span'
                sx={{
                  fontSize: '12px',
                  fontWeight: 400,
                  color: 'customColors.OnSurfaceVariant'
                }}
              >
                Total Quantity Price -{' '}
                {Utility.formatAmountToReadableDigit(watch('unit_price') * watch('request_item_qty')) || 0}
              </Typography>
            </Box>
          </Grid>

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
          {/* <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
            <Button type='submit' variant='contained'>
              Add
            </Button>
          </Grid> */}
        </Grid>
      </form>
    </>
  )
}
