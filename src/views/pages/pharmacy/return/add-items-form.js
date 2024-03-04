import React, { useEffect, useState } from 'react'
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
import { getValue } from '@mui/system'

import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'

import TableCell from '@mui/material/TableCell'
import UserSnackbar from 'src/components/utility/snackbar'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import ConfirmDialogBox from 'src/components/ConfirmDialogBox'

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

  available_item_qty: '',
  expiry_date: ''
}

const schema = yup.object().shape({
  request_item: yup.object().shape({
    label: yup.string().required('Product Name is required'),
    value: yup.string().required('Product Name is required')
  }),
  request_item_batch_no: yup.object().shape({
    label: yup.string().required('Batch no is required'),
    value: yup.string().required('Batch no is required'),
    expiry_date: yup.string().required('Batch no is required')
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

  // console.log('nestedMedicine', nestedMedicine)
  // console.log('batchLoading', batchLoading)

  const onSubmit = async params => {
    const { request_item_batch_no, request_item_qty, available_item_qty, expiry_date, request_item } = { ...params }
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

      return
    }
    if (request_item_qty > available_item_qty) {
      const invalidItems = [
        {
          request_item_batch_no: request_item_batch_no?.value,
          request_item_qty,
          available_item_qty,
          expiry_date,
          request_item_medicine_id: request_item?.value,
          product_name: request_item?.label,
          priority_item: 'Normal',
          uuid: nestedMedicine?.uuid
        }
      ]

      // console.log('invalid items', invalidItems)
      setInvalidQty(invalidItems)

      setInvalidQtyDialog(true)

      return
    }
    clearErrors('request_item_batch_no')

    if (totalAvailableCount < 0) {
      setQuantityError(true)

      return
    }

    onSubmitData(
      {
        request_item_batch_no: request_item_batch_no?.value,
        request_item_qty,
        available_item_qty,
        expiry_date,
        request_item_medicine_id: request_item?.value,
        product_name: request_item?.label,
        priority_item: 'Normal',
        uuid: nestedMedicine?.uuid
      },
      type
    )
  }

  const confirmDataSubmit = () => {
    const type = nestedMedicine?.uuid === '' ? 'new' : 'update'
    onSubmitData(
      {
        request_item_batch_no: invalidQty[0]?.request_item_batch_no,
        request_item_qty: invalidQty[0]?.request_item_qty,
        available_item_qty: invalidQty[0]?.available_item_qty,
        expiry_date: invalidQty[0]?.expiry_date,
        request_item_medicine_id: invalidQty[0]?.request_item_medicine_id,
        product_name: invalidQty[0]?.product_name,
        priority_item: invalidQty[0]?.priority_item,
        uuid: invalidQty[0]?.uuid
      },
      type
    )
  }
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
        available_item_qty: nestedMedicine?.available_item_qty

        // available_item_qty: nestedMedicine?.available_item_qty
      })
      async function searchMedicine() {
        await searchMedicineData(nestedMedicine?.request_item_medicine_id)
      }

      async function searchBatch() {
        await searchBatchData(nestedMedicine?.request_item_medicine_id)
      }

      searchMedicine()
      searchBatch()

      checkTotalCount()
    } else {
    }
    checkTotalCount()
  }, [])

  useEffect(() => {
    checkTotalCount()
  }, [error, totalQuantity, batchLoading])

  const checkTotalCount = e => {
    console.log('nestedMedicine', nestedMedicine)
    debugger

    // console.log('editParams', editParams)
    const productId = watch('request_item')
    const quantity = watch('request_item_qty')
    debugger
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
        expiry_date: nestedMedicine?.expiry_date
      })
    } else {
    }
  }, [])

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

  const checkTotalCount = e => {
    console.log('nestedMedicine', nestedMedicine)
    debugger

    // console.log('editParams', editParams)
    const productId = watch('request_item')
    const quantity = watch('request_item_qty')
    debugger
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
                      setValue('available_item_qty', '')

                      if (value !== '' && value !== null) {
                        searchBatchData(value.value)
                      }
                      checkTotalCount()
                    }} // Set selected value
                    loading={productLoading}
                    noOptionsText='Type to search'
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Product Name*'
                        placeholder='Search'
                        error={Boolean(errors.request_item)}
                      />
                    )}
                  />
                )}
              />
              {errors?.request_item && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.request_item?.message}</FormHelperText>
              )}
            </FormControl>
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
                      // console.log('batch values', value)

                      // setValue('request_item', value)
                      setValue('request_item_batch_no', value)
                      setValue('expiry_date', value?.expiry_date)
                      setValue('available_item_qty', value?.available_item_qty)
                      clearErrors('request_item_batch_no')

                      // seValu
                    }} // Set selected value
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
                <Typography sx={{ fontSize: 14, mx: 2 }}>
                  Qty available for this batch:{getValues('available_item_qty')}
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

          <Grid item xs={12} sm={12} display={'flex'}>
            <Typography>Available Quantity: </Typography>
            <Typography> {batchLoading ? 0 : totalAvailableCount}</Typography>
          </Grid>

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
      <ConfirmDialogBox
        open={invalidQtyDialog}
        closeDialog={() => {
          closeConfirmationDialog()
        }}
        action={() => {
          closeConfirmationDialog()
        }}
        content={
          <Box>
            <>
              <DialogContent>
                <DialogContentText sx={{ mb: 1 }}>
                  You are trying to full fill higher quantity than it is available in that batch
                </DialogContentText>
                <Table>
                  <TableRow>
                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Product</TableCell>

                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Batch no</TableCell>
                    <TableCell sx={{ borderRight: '1px solid #ccc' }}>Available qty</TableCell>
                    <TableCell>Requested qty</TableCell>
                  </TableRow>
                  {invalidQty?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item?.product_name}</TableCell>
                      <TableCell>{item?.request_item_batch_no}</TableCell>
                      <TableCell>{item?.available_item_qty}</TableCell>
                      <TableCell>{item?.request_item_qty}</TableCell>
                    </TableRow>
                  ))}
                </Table>
              </DialogContent>
              <DialogContentText sx={{ mb: 1 }}>Confirm to proceed</DialogContentText>
              <DialogActions className='dialog-actions-dense'>
                <Button
                  size='small'
                  variant='contained'
                  color='primary'
                  onClick={() => {
                    confirmDataSubmit()
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant='contained'
                  size='small'
                  color='error'
                  onClick={() => {
                    closeConfirmationDialog()
                  }}
                >
                  Cancel
                </Button>
              </DialogActions>
            </>
          </Box>
        }
      />
      {/* </CardContent> */}
    </>
  )
}
