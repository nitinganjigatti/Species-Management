import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Grid, Button, Typography } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useTheme } from '@emotion/react'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ProductOption from 'src/views/pages/pharmacy/utility/ProductOption'
import ProductDetailsCard from 'src/views/pages/pharmacy/utility/ProductDetailsCard'
import BatchOption from 'src/views/pages/pharmacy/utility/BatchOption'
import dayjs from 'dayjs'

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

  request_item_batch_no: yup
    .object()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .required('Batch number is required')
    .test('is-valid-object', 'Batch number is required', value => {
      return value !== null && typeof value === 'object' && value.label && value.value && value.expiry_date
    }),

  // request_item_batch_no: yup
  //   .mixed()
  //   .required('Batch number is required')
  //   .test('is-object-with-properties', 'Batch number is required', value => {
  //     return (
  //       value !== null && typeof value === 'object' && 'label' in value && 'value' in value && 'expiry_date' in value
  //     )
  //   }),
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
      multiplier,
      unit_price
    } = {
      ...params
    }
    const type = nestedMedicine?.uuid === '' ? 'new' : 'update'

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

      return
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

    // return

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
        multiplier,
        unit_price
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

    const available_qty = parseInt(totalQuantity)

    //  const available_qty = parseInt(totalQuantity)- (totalCount - nestedItemQuantity + enteredCount) removed  subtraction function while doing  qty entry
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
  const handleProductChange = value => {
    if (!value) {
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
    }
    if (value !== '' && value !== null) {
      setQuantityError(false)
      searchBatchData(value?.value, value?.stock_type)
      setValue('stock_type', value?.stock_type)
      setValue('packageDetails', value?.packageDetails)
      setValue('manufacture', value?.manufacture)
      setValue('control_substance', value?.control_substance)
      setValue('unit_price', value?.unit_price)
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
    setValue('variant_id', value?.variant_id), setValue('unit_price', value?.unit_price)

    clearErrors('batch_no')
    setQuantityError(false)
    checkTotalCount()
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

  return (
    <>
      {/* <CardContent> */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Grid container rowSpacing={4} columnSpacing={2} size={{ xs: 12, sm: 12 }}>
          <Grid item size={{ xs: 12, sm: 12, lg: 12 }}>
            <ControlledAutocomplete
              name='request_item'
              label='Product Name*'
              fullWidth={true}
              control={control}
              errors={errors}
              options={productList}
              loading={productLoading}
              onKeyUp={e => searchMedicineData(e.target.value)}
              onChangeOverride={handleProductChange}
              onBlur={() => searchMedicineData(nestedMedicine?.stock_id, nestedMedicine?.stock_type)}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props

                return <ProductOption key={key} option={option} {...otherProps} />
              }}
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
          <Grid item size={{ xs: 12, sm: 12 }}>
            <Typography
              variant='subtitle1'
              sx={{ color: 'customColors.customTextColorGray2', fontSize: '14px', fontWeight: 500 }}
            >
              {getValues('stock_type') === 'non_medical' ? 'Batch No' : 'Batch No and Expiry Date'}
            </Typography>
          </Grid>
          <Grid
            item
            size={{ xs: 12, sm: getValues('stock_type') === 'non_medical' ? 6 : 4 }}
            sm={getValues('stock_type') === 'non_medical' ? 6 : 4}
          >
            <ControlledAutocomplete
              name='request_item_batch_no'
              label='Batch No*'
              control={control}
              errors={errors}
              options={batchList}
              loading={batchLoading}
              getOptionLabel={option => option.label || ''}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              onChangeOverride={handleBatchChange}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props

                return <BatchOption key={key} option={option} {...otherProps} />
              }}
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
          <Grid item size={{ xs: 12, sm: getValues('stock_type') === 'non_medical' ? 6 : 4 }}>
            <ControlledTextField
              name='multiplier'
              label='Product Variant'
              control={control}
              errors={errors}
              disabled={true}
            />
          </Grid>
          {getValues('stock_type') === 'non_medical' ? null : (
            <Grid item size={{ xs: 12, sm: 4 }}>
              <ControlledTextField
                name='expiry_date'
                label='Expiry Date*'
                control={control}
                errors={errors}
                required={true}
                readOnly={true}
                dateReader={true}
              />
            </Grid>
          )}
          <Grid item size={{ xs: 12, sm: 12 }}>
            <Typography
              variant='subtitle1'
              sx={{ color: 'customColors.customTextColorGray2', fontSize: '14px', fontWeight: 500 }}
            >
              Quantity
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, sm: getValues('stock_type') === 'non_medical' ? 6 : 12 }}>
            <ControlledTextField
              name='request_item_qty'
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

          {quantityError && (
            <Grid item size={{ xs: 12 }}>
              <Typography
                sx={{
                  color: 'error.main'
                }}
              >
                Quantity should be lesser than available Quantity.
              </Typography>
            </Grid>
          )}
          <Grid
            item
            size={{ xs: 12 }}
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 4
            }}
          >
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
