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

const defaultValues = {
  request_item: {
    label: '',
    value: ''
  },
  batch_no: {
    label: '',
    value: '',
    expiry_date: ''
  },
  quantity: '',
  stock_type: '',

  available_item_qty: '',
  expiry_date: '',
  packageDetails: '',
  manufacture: '',
  comments: ''
}

const schema = yup.object().shape({
  request_item: yup.object().shape({
    label: yup.string().required('Product Name is required'),
    value: yup.string().required('Product Name is required')
  }),

  // batch_no: yup.object().shape({
  //   label: yup.string().required('Batch no is required'),
  //   value: yup.string().required('Batch no is required'),
  //   expiry_date: yup.string().required('Batch no is required')
  // }),
  batch_no: yup
    .mixed()
    .required('Batch number is required')
    .test('is-object-with-properties', 'Batch number is required', value => {
      return (
        value !== null && typeof value === 'object' && 'label' in value && 'value' in value && 'expiry_date' in value
      )
    }),
  quantity: yup
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
  editParams
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

  const onSubmit = async params => {
    setBatchError(false)

    const {
      stock_type,
      batch_no,
      quantity,
      available_item_qty,
      expiry_date,
      request_item,
      packageDetails,
      manufacture,
      comments
    } = {
      ...params
    }
    const type = nestedMedicine?.uuid === '' ? 'new' : 'update'

    const isMedicineAlreadyExists = editParams?.items?.some(
      item =>
        item.stock_id === request_item.value && item.batch_no === batch_no.value && nestedMedicine?.uuid !== item.uuid
    )

    if (isMedicineAlreadyExists) {
      setBatchError(true)
      setError('batch_no', {
        type: 'manual',
        message: 'Batch already exists'
      })
      console.log('Medicine already exists')

      return
    }

    if (Number(quantity) > Number(available_item_qty)) {
      setQuantityError(true)

      return
    }

    clearErrors('batch_no')

    onSubmitData(
      {
        batch_no: batch_no.value,
        quantity,
        available_item_qty,
        expiry_date,
        stock_id: request_item.value,
        medicine_name: request_item.label,
        uuid: nestedMedicine?.uuid,
        stock_type,
        packageDetails,
        manufacture,
        comments
      },
      type
    )
  }

  const checkTotalCount = async e => {
    const productId = watch('request_item')
    const quantity = watch('quantity')

    var totalCount = 0
    var enteredCount = 0
    var nestedItemQuantity = 0

    if (e?.target?.value !== undefined) {
      enteredCount = isNaN(parseInt(e?.target?.value)) ? 0 : parseInt(e?.target?.value)
    } else {
      enteredCount = isNaN(parseInt(quantity)) ? 0 : parseInt(quantity)
    }

    if (productId !== undefined) {
      const filteredList = editParams?.items?.filter(item => item.stock_id === productId?.value)
      totalCount = filteredList?.reduce((acc, item) => acc + parseInt(item.quantity), 0)
    }

    if (nestedMedicine.quantity !== '') {
      nestedItemQuantity = nestedMedicine?.quantity
    }

    const available_qty = parseInt(totalQuantity) - (totalCount - nestedItemQuantity + enteredCount)

    setTotalAvailableCount(available_qty)
  }

  useEffect(() => {
    checkTotalCount()
  }, [totalQuantity])

  useEffect(() => {
    if (nestedMedicine?.id === undefined && nestedMedicine?.medicine_name !== '' && nestedMedicine?.uuid !== '') {
      reset({
        request_item: {
          label: nestedMedicine?.medicine_name,
          value: nestedMedicine?.stock_id
        },
        batch_no: {
          label: nestedMedicine?.batch_no,
          value: nestedMedicine?.batch_no,
          expiry_date: nestedMedicine?.expiry_date
        },
        quantity: nestedMedicine?.quantity,
        expiry_date: nestedMedicine?.expiry_date,
        available_item_qty: nestedMedicine?.available_item_qty,
        stock_type: nestedMedicine?.stock_type,
        packageDetails: nestedMedicine?.packageDetails,
        manufacture: nestedMedicine?.manufacture,
        comments: nestedMedicine?.comments
      })
      console.log('available_item_qty in nested ', nestedMedicine?.available_item_qty)
      async function searchMedicine() {
        await searchMedicineData(nestedMedicine?.stock_id, nestedMedicine.stock_type)
      }

      async function searchBatch() {
        await searchBatchData(nestedMedicine?.stock_id, nestedMedicine.stock_type)
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
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <Grid container spacing={5} xs={12}>
          <Grid item xs={12} sm={6}>
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
                      setValue('batch_no', '')
                      setValue('expiry_date', '')
                      setValue('available_item_qty', '')
                      setValue('stock_type', '')
                      setValue('packageDetails', '')
                      setValue('manufacture', '')

                      if (value !== '' && value !== null) {
                        setQuantityError(false)
                        searchBatchData(value.value, value.stock_type)
                        setValue('stock_type', value.stock_type)
                        setValue('packageDetails', value.packageDetails)
                        setValue('manufacture', value.manufacture)
                      }
                      checkTotalCount()
                    }} // Set selected value
                    onBlur={async () => {
                      await searchMedicineData(nestedMedicine?.stock_id, nestedMedicine.stock_type)
                    }}
                    renderOption={(props, option) => (
                      <li
                        {...props}
                        style={{ opacity: option.status ? 1 : 0.5, pointerEvents: option.status ? 'auto' : 'none' }}
                      >
                        <Box>
                          <Typography>{option.label}</Typography>
                          <Typography variant='body2'>{option.packageDetails}</Typography>
                          <Typography variant='body2'>{option.manufacture}</Typography>
                        </Box>
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
              {watch('packageDetails') && (
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
              )}
            </FormControl>
            {watch('packageDetails') && (
              <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2 }}>
                {batchLoading ? <LoaderIcon /> : ` Total Available Quantity:${totalAvailableCount}`}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='batch_no'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    id='batch_no'
                    options={batchList === undefined ? [] : batchList}
                    getOptionLabel={option => option.label || ''}
                    value={field.value}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    onChange={(e, value) => {
                      // console.log('value', value)
                      // setValue('request_item', value)
                      setValue('batch_no', value)
                      setValue('expiry_date', value?.expiry_date)
                      setValue('available_item_qty', value?.available_item_qty)
                      clearErrors('batch_no')
                      setQuantityError(false)
                      checkTotalCount()

                      // seValu
                    }} // Set selected value
                    loading={batchLoading}
                    noOptionsText='Type to search'
                    renderInput={params => (
                      <TextField {...params} label='Batch No*' placeholder='Search' error={Boolean(errors.batch_no)} />
                    )}
                  />
                )}
              />
              {errors?.batch_no && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.batch_no?.message}</FormHelperText>
              )}
              {getValues('available_item_qty') ? (
                <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2 }}>
                  Available Quantity:{getValues('available_item_qty')}
                </Typography>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='quantity'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Quantity*'
                    name='quantity'
                    error={Boolean(errors.quantity)}
                    onChange={onChange}
                    onKeyDown={checkTotalCount}
                    onPaste={checkTotalCount}
                    onInput={checkTotalCount}
                  />
                )}
              >
                {errors.quantity && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.quantity?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>

          {getValues('stock_type') === 'non_medical' ? null : (
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
          )}
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Controller
                name='comments'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    multiline
                    rows={2}
                    value={value}
                    label='Comments'
                    name='comments'
                    error={Boolean(errors.comments)}
                    onChange={onChange}
                  />
                )}
              >
                {errors.comments && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.comments?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          {/* <Grid item xs={12}>
            <Typography sx={{ mx: 2 }}>
              {batchLoading ? <LoaderIcon /> : `Available Quantity:${totalAvailableCount}`}
            </Typography>
          </Grid> */}
          {quantityError && (
            <Grid item xs={12}>
              <Typography color={'error.main'}>Quantity should be lesser than available Quantity.</Typography>
            </Grid>
          )}
          <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
            <Button type='submit' variant='contained'>
              Save
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  )
}
