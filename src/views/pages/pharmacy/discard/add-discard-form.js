import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import dayjs from 'dayjs'
import { Grid, Button, Typography } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ProductOption from 'src/views/pages/pharmacy/utility/ProductOption'
import ProductDetailsCard from 'src/views/pages/pharmacy/utility/ProductDetailsCard'
import BatchOption from 'src/views/pages/pharmacy/utility/BatchOption'
import FormFieldLabel from 'src/views/utility/FormFieldLabel'

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
  comments: '',
  reason: '',
  control_substance: false,
  variant_id: '',
  multiplier: ''
}

const schema = yup.object().shape({
  request_item: yup
    .object()
    .shape({
      label: yup.string().required('Product Name is required'),
      value: yup.string().required('Product Name is required')
    })
    .required('Product Name is required'),

  batch_no: yup
    .object()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .required('Batch number is required')
    .test('is-valid-object', 'Batch number is required', value => {
      return value !== null && typeof value === 'object' && value.label && value.value && value.expiry_date
    }),

  quantity: yup
    .number()
    .transform((value, originalValue) => {
      return originalValue === '' ? null : value
    })
    .required('Quantity is required')
    .typeError('Quantity must be a number')
    .positive('Quantity must be a positive number')
    .integer('Quantity must be an integer'),

  expiry_date: yup.string().required('Expiry Date is required'),

  // reason:
  //  yup
  //   .string()
  //   .required('Reason is required')
  //   .test('check-expiry', 'Expired must be selected for expired batches', function (value) {
  //     const { expiry_date } = this.parent

  //     if (expiry_date) {
  //       const isExpired = dayjs(expiry_date, 'YYYY-MM-DD').isBefore(dayjs())
  //       if (isExpired) {
  //         return value === 'Product Expired'
  //       }
  //     }

  //     return true
  //   }),
  reason: yup
    .string()
    .required('Reason is required')
    .test('check-expiry', 'Expired must be selected for expired batches', function (value) {
      const { expiry_date } = this.parent
      const { stock_type } = this.parent || {}

      if (stock_type === 'non_medical') {
        return true
      }

      if (expiry_date) {
        const isExpired = dayjs(expiry_date, 'YYYY-MM-DD').isBefore(dayjs())
        if (isExpired) {
          return value === 'Product Expired'
        }
      }

      return true
    }),

  comments: yup
    .string()
    .test('comments-required', 'Comments are required when "Others" reason is selected', function (value) {
      const { reason } = this.parent

      if (reason === 'Others') {
        return value !== undefined && value.trim().length > 0
      }

      return true
    })
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
  reasonsOptions,
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
      comments,
      reason,
      variant_id,
      multiplier,
      control_substance,
      unit_price
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
        comments,
        reason,
        control_substance,
        variant_id,
        multiplier,
        unit_price
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

  const handleProductChange = value => {
    setValue('request_item', value, { shouldValidate: true })
    setValue('batch_no', '', { shouldValidate: true })
    setValue('expiry_date', '', { shouldValidate: true })
    setValue('available_item_qty', '', { shouldValidate: true })
    setValue('reason', '', { shouldValidate: true })
    setValue('stock_type', '')
    setValue('packageDetails', '')
    setValue('manufacture', '')
    setValue('unit_price', '')

    if (!value?.expiry_date) {
      setError('expiry_date', {
        type: 'manual',
        message: 'Expiry Date is required'
      })
    } else {
      clearErrors('expiry_date')
    }

    if (value !== '' && value !== null) {
      setQuantityError(false)
      searchBatchData(value?.value, value?.stock_type)
      setValue('stock_type', value?.stock_type)
      setValue('packageDetails', value?.packageDetails)
      setValue('manufacture', value?.manufacture)
      setValue('control_substance', value?.control_substance)
      setValue('unit_price', value.unit_price)
    }

    checkTotalCount()
  }

  const handleBatchChange = value => {
    const isExpired = dayjs(value?.expiry_date, 'YYYY-MM-DD').isBefore(dayjs())

    if (isExpired && value?.stock_type !== 'non_medical') {
      setValue('reason', 'Product Expired', { shouldValidate: true })
    } else {
      setValue('reason', '', { shouldValidate: true })
    }
    if (!value?.expiry_date) {
      setError('expiry_date', {
        type: 'manual',
        message: 'Expiry Date is required'
      })
    } else {
      clearErrors('expiry_date')
    }

    setValue('batch_no', value, { shouldValidate: true })
    setValue('expiry_date', value?.expiry_date, { shouldValidate: true })
    setValue('available_item_qty', value?.available_item_qty)
    setValue('multiplier', value?.multiplier)
    setValue('variant_id', value?.variant_id)
    clearErrors('batch_no')
    setQuantityError(false)
    checkTotalCount()
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
        comments: nestedMedicine?.comments,
        reason: nestedMedicine?.reason,
        variant_id: nestedMedicine?.variant_id,
        multiplier: nestedMedicine?.multiplier,
        unit_price: nestedMedicine?.unit_price
      })
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <Grid container rowSpacing={4} columnSpacing={2} xs={12}>
        <Grid item xs={12} sm={12}>
          <ControlledAutocomplete
            name='request_item'
            label='Product Name*'
            control={control}
            errors={errors}
            options={productList}
            loading={productLoading}
            onKeyUp={e => searchMedicineData(e.target.value)}
            onChangeOverride={handleProductChange}
            onBlur={() => searchMedicineData(nestedMedicine?.stock_id, nestedMedicine?.stock_type)}
            renderOption={(props, option) => <ProductOption option={option} {...props} />}
          />

          {watch('packageDetails') && (
            <ProductDetailsCard
              packageDetails={watch('packageDetails')}
              manufacture={watch('manufacture')}
              totalAvailableCount={totalAvailableCount}
              batchLoading={batchLoading}
            />
          )}
        </Grid>

        <Grid item xs={12} sm={12}>
          <FormFieldLabel text={getValues('stock_type') === 'non_medical' ? 'Batch No' : 'Batch No and Expiry Date'} />
        </Grid>

        <Grid item xs={12} sm={getValues('stock_type') === 'non_medical' ? 6 : 4}>
          <ControlledAutocomplete
            name='batch_no'
            label='Batch No*'
            control={control}
            errors={errors}
            options={batchList}
            loading={batchLoading}
            getOptionLabel={option => option.label || ''}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            onChangeOverride={handleBatchChange}
            renderOption={(props, option) => <BatchOption option={option} {...props} />}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1,
                '& .MuiAutocomplete-listbox': {
                  p: 0,
                  maxHeight: '300px'
                }
              }
            }}
            textFieldProps={{
              placeholder: 'Search',
              sx: {
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white'
                }
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={getValues('stock_type') === 'non_medical' ? 6 : 4}>
          <ControlledTextField
            name='multiplier'
            label='Product Variant'
            control={control}
            errors={errors}
            disabled={true}
          />
        </Grid>
        {getValues('stock_type') != 'non_medical' && (
          <Grid item xs={12} sm={4}>
            <ControlledTextField
              name='expiry_date'
              label='Expiry Date*'
              control={control}
              errors={errors}
              required={true}
              readOnly={true}
            />
          </Grid>
        )}

        <Grid item xs={12} sm={12}>
          <FormFieldLabel text='Quantity' />
        </Grid>
        <Grid item xs={12} sm={12}>
          <ControlledTextField
            name='quantity'
            label='Quantity*'
            control={control}
            errors={errors}
            type='number'
            required
            inputProps={{ min: 0 }}
            onKeyDown={checkTotalCount}
            onPaste={checkTotalCount}
            onInput={checkTotalCount}
          />
        </Grid>
        <Grid item xs={12} sm={12}>
          <FormFieldLabel text='Reason for Discard' />
        </Grid>
        <Grid item xs={12} sm={12}>
          <ControlledSelect
            name='reason'
            label='Select reason*'
            control={control}
            errors={errors}
            options={reasonsOptions}
            required
            isOptionDisabled={option =>
              watch('stock_type') === 'non_medical' && (option === 'Expired' || option === 'About to expire')
            }
          />
        </Grid>
        <Grid item xs={12} sm={12}>
          <ControlledTextField name='comments' label='Comments' control={control} errors={errors} required />
        </Grid>
        {quantityError && (
          <Grid item xs={12}>
            <Typography color={'error.main'}>Quantity should be lesser than available Quantity.</Typography>
          </Grid>
        )}
        <Grid item xs={12} display={'flex'} justifyContent={'flex-end'} gap={3}>
          <Button variant='outlined' onClick={closeDialog}>
            Cancel
          </Button>
          <Button type='submit' variant='contained'>
            Add
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}
