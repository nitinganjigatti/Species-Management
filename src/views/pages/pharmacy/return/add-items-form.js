import React, { useEffect, useState } from 'react'
import { useForm, Controller, get } from 'react-hook-form'
import { Grid, FormControl, Autocomplete, TextField, FormHelperText, Button, Typography } from '@mui/material'
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

const defaultValues = {
  request_item: {
    label: '',
    value: '',
    control_substance: false
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
  manufacture: ''
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
      manufacture
    } = {
      ...params
    }
    const type = nestedMedicine?.uuid === '' ? 'new' : 'update'

    // console.log('params', params)

    const isMedicineAlreadyExists = editParams.request_item_details.some(
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

      // alert('2')

      return

      // alert('3')
    }
    if (request_item_qty > available_item_qty) {
      setQuantityError(true)

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

      return

      // alert('3')
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
        manufacture
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
        manufacture: nestedMedicine?.manufacture
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
            {totalAvailableCount ? (
              <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2 }}>
                {batchLoading ? <LoaderIcon /> : ` Total Available Quantity:${totalAvailableCount}`}
              </Typography>
            ) : null}
          </Grid>
          <Grid item xs={12} sm={6}>
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
                <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2 }}>
                  Available Quantity:{getValues('available_item_qty')}
                </Typography>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
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
          {/* <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='available_item_qty'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    value={value}
                    label='Available Quantity*'
                    name='available_item_qty'
                    error={Boolean(errors.available_item_qty)}
                    onChange={onChange}
                    disabled
                  />
                )}
              >
                {errors.available_item_qty && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.available_item_qty?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid> */}

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

          {/* <Grid item xs={12} sm={12} display={'flex'}>
            <Typography sx={{ mx: 2 }}>
              {batchLoading ? <LoaderIcon /> : `Available Quantity:${totalAvailableCount}`}
            </Typography>
          </Grid> */}

          {quantityError && (
            <Grid item xs={12}>
              <Typography color={'error.main'}>Quantity should be lesser than available Quantity.</Typography>
            </Grid>
          )}
          {console.log('request_item_batch_no', getValues('request_item_batch_no'))}
          <Grid item xs={12} display={'flex'} justifyContent={'flex-end'}>
            <Button type='submit' variant='contained'>
              Save
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* <ConfirmDialog
        open={invalidQtyDialog}
        title={'Your quantity exceeds the batch limit'}
        closeDialog={() => {
          closeConfirmationDialog()
        }}
        action={() => {
          confirmDataSubmit()
        }}
        content={
          <>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#e3e3e3' }}>
                  <TableCell sx={{ py: 1, borderRight: '1px solid #ccc' }}>Product</TableCell>
                  <TableCell sx={{ py: 1, borderRight: '1px solid #ccc' }}>Batch no</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #ccc' }}>Available qty</TableCell>
                  <TableCell>Requested qty</TableCell>
                </TableRow>
              </TableHead>
              {invalidQty?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell
                    sx={{
                      py: 1,
                      borderRight: '1px solid #ccc',
                      borderBottom: index === invalidQty.length - 1 && 'none'
                    }}
                  >
                    {item?.product_name}
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      borderRight: '1px solid #ccc',
                      borderBottom: index === invalidQty.length - 1 && 'none'
                    }}
                  >
                    {item?.request_item_batch_no}
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      borderRight: '1px solid #ccc',
                      borderBottom: index === invalidQty.length - 1 && 'none'
                    }}
                  >
                    {item?.available_item_qty}
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      borderRight: '1px solid #ccc',
                      borderBottom: index === invalidQty.length - 1 && 'none'
                    }}
                  >
                    {item?.request_item_qty}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </>
        }
      /> */}
      {/* </CardContent> */}
    </>
  )
}
