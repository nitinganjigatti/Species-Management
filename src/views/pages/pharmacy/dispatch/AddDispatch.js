import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Grid, Button, Typography, alpha } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useTheme } from '@emotion/react'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ProductOption from '../utility/ProductOption'
import BatchOption from '../utility/BatchOption'
import ProductDetailsCard from '../utility/ProductDetailsCard'
import IconButton from './IconButton'

const defaultValues = {
  request_item: {
    label: '',
    value: ''
  },
  product_batches: [],
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

  product_batches: yup
    .array()
    .of(
      yup.object().shape({
        request_item_batch_no: yup
          .mixed()
          .test('is-object', 'Batch number must be an object', function (value) {
            // Allow null/undefined (handled by required check)
            if (value === null || value === undefined) return true

            // Check if it's an object
            return typeof value === 'object' && value !== null
          })
          .test('has-required-fields', 'Batch number must have label and value', function (value) {
            // Allow null/undefined (handled by required check)
            if (value === null || value === undefined) return true

            // Check if it has both label and value properties
            return value.label !== undefined && value.value !== undefined
          })
          .test('unique-batch', 'Batch number already exists', function (value) {
            if (!value || !value.value) return true

            const { editParams = {}, nestedMedicine = {} } = this.options.context || {}

            // Get the root form data
            const rootData = this.from[this.from.length - 1].value
            const currentBatches = rootData?.product_batches || []

            // Extract current index from path
            const pathMatch = this.path.match(/product_batches\[(\d+)\]/)
            const currentIndex = pathMatch ? parseInt(pathMatch[1]) : -1

            // Check against editParams (existing data in the system)
            const isInEditParams = editParams?.request_item_details?.some(
              item => item.request_item_batch_no === value.value && item.uuid !== nestedMedicine?.uuid
            )

            // Check against current form entries (excluding current index)
            const isDuplicateInForm = currentBatches.some((batch, idx) => {
              const batchValue = batch?.request_item_batch_no?.value

              return batchValue === value.value && idx !== currentIndex
            })

            return !(isInEditParams || isDuplicateInForm)
          })
          .required('Batch number is required'),
        request_item_qty: yup
          .number()
          .typeError('Quantity must be a number')
          .required('Quantity is required')
          .positive('Quantity must be a positive number')
          .test('max-quantity', 'Quantity exceeds available stock', function (value) {
            // Get available quantity from parent object
            const availableQty = this.parent.request_item_batch_no?.available_item_qty

            // Handle cases where availableQty might be undefined, null, or empty string
            if (!availableQty || availableQty === '' || availableQty === null) {
              return true // Skip validation if no available quantity is set
            }

            // Convert to number for comparison
            const availableQtyNum = parseFloat(availableQty)
            const valueNum = parseFloat(value)

            // Check if conversion was successful
            if (isNaN(availableQtyNum) || isNaN(valueNum)) {
              return true // Skip validation if numbers are invalid
            }
            const result = valueNum <= availableQtyNum

            return result
          }),
        expiry_date: yup.string().required('Expiry Date is required'),
        multiplier: yup.string().required('Product Variant is required')
      })
    )
    .min(1, 'At least one batch is required'),

  stock_type: yup.string().required('Stock type is required')
})

export const AddDispatchForm = ({
  searchMedicineData,
  productList,
  productLoading,
  onSubmitData,
  searchBatchData,
  batchLoading,
  batchList,
  nestedMedicine,
  totalQuantity,
  editParams,
  closeDialog,
  isEdit = false
}) => {
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    clearErrors,
    trigger,
    watch
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange',
    context: { editParams, nestedMedicine }
  })
  const theme = useTheme()
  const [totalAvailableCount, setTotalAvailableCount] = useState(0)

  const { fields, append, remove, insert, replace } = useFieldArray({
    control,
    name: 'product_batches' // Array of product batches
  })

  useEffect(() => {
    if (fields.length === 0) {
      append({
        request_item_batch_no: null,
        expiry_date: '',
        available_item_qty: '',
        multiplier: '',
        variant_id: '',
        request_item_qty: ''
      })
    }
  }, [fields, append])

  const onSubmit = async params => {
    const isValid = await trigger()

    if (!isValid) {
      return
    }

    const { product_batches, request_item, stock_type, packageDetails, manufacture, control_substance, unit_price } =
      params

    const type = nestedMedicine?.uuid === '' ? 'new' : 'update'

    const submitData = product_batches.map(batch => ({
      request_item_batch_no: batch.request_item_batch_no.value,
      request_item_qty: batch.request_item_qty,
      available_item_qty: batch.available_item_qty,
      expiry_date: batch.expiry_date,
      request_item_medicine_id: request_item.value,
      product_name: request_item.label,
      priority_item: 'Normal',
      uuid: nestedMedicine?.uuid,
      stock_type,
      packageDetails,
      manufacture,
      control_substance,
      variant_id: batch.variant_id,
      multiplier: batch.multiplier,
      unit_price
    }))
    console.log('onSubmit - submitData:', submitData)

    onSubmitData(submitData, type)
  }

  const addSaltButton = () => (
    <IconButton
      icon='si:add-duotone'
      onClick={() => {
        append({
          request_item_batch_no: null,
          expiry_date: '',
          available_item_qty: '',
          multiplier: '',
          variant_id: '',
          request_item_qty: ''
        })
      }}
      color='primary'
      style={{
        backgroundColor: theme.palette.customColors.Surface,
        color: theme.palette.primary.main,
        border: `1px solid ${theme.palette.primary.main}`
      }}
    />
  )

  const removeSaltButton = index => (
    <IconButton
      icon='material-symbols-light:close-small'
      onClick={() => remove(index)}
      color='error'
      marginLeft='10px'
      style={{
        backgroundColor: alpha(theme.palette.customColors.Error, 0.1),
        color: theme.palette.customColors.Error,
        border: `1px solid ${theme.palette.customColors.Error}`
      }}
    />
  )

  const clearSaltFields = index => (
    <IconButton
      icon='material-symbols-light:close-small'
      onClick={() => {
        remove(index)
        insert(index, {})
        clearErrors(`product_batches[${index}].request_item_batch_no`)
      }}
      color='error'
      marginLeft='10px'
      style={{
        backgroundColor: alpha(theme.palette.customColors.Error, 0.1),
        color: theme.palette.customColors.Error,
        border: `1px solid ${theme.palette.customColors.Error}`
      }}
    />
  )

  const checkTotalCount = async e => {
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

    setTotalAvailableCount(available_qty)
  }

  useEffect(() => {
    checkTotalCount()
  }, [totalQuantity])

  useEffect(() => {
    if (nestedMedicine?.id === undefined && nestedMedicine?.medicine_name !== '' && nestedMedicine?.uuid !== '') {
      const productBatches = [
        {
          ...nestedMedicine?.product_batches[0],
          request_item_batch_no: {
            label: nestedMedicine?.request_item_batch_no,
            value: nestedMedicine?.request_item_batch_no,
            expiry_date: nestedMedicine?.expiry_date,
            available_item_qty: nestedMedicine?.available_item_qty,
            multiplier: nestedMedicine?.multiplier,
            variant_id: nestedMedicine?.variant_id,
            unit_price: nestedMedicine?.unit_price
          }
        } || []
      ]

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
        product_batches: productBatches || [],
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

  const handleAddRemoveSalts = (fields, index) => {
    if (fields.length === 1) {
      return (
        <>
          {addSaltButton()}
          {clearSaltFields(index)}
        </>
      )
    } else if (index === fields.length - 1) {
      return (
        <>
          {addSaltButton()}
          {removeSaltButton(index)}
        </>
      )
    } else {
      return removeSaltButton(index)
    }
  }

  const handleProductSelection = (value, isClear = false) => {
    // Common field clearing logic
    const clearFields = () => {
      setValue('request_item_batch_no', '')
      setValue('expiry_date', '')
      setValue('available_item_qty', '')
      setValue('stock_type', '')
      setValue('packageDetails', '')
      setValue('manufacture', '')
      setValue('unit_price', '')
      setValue('product_batches', [])
    }

    // Handle clear action
    if (isClear) {
      setValue('request_item', null)
      clearFields()

      return
    }

    // Handle normal change action
    setValue('request_item', value)
    replace([])

    if (!value) {
      clearFields()

      return
    }

    if (value === null || value.status === 0) {
      return
    }

    if (value !== '' && value !== null) {
      searchBatchData(value.value, value.stock_type)
      setValue('stock_type', value.stock_type)
      setValue('packageDetails', value.packageDetails)
      setValue('manufacture', value.manufacture)
      setValue('control_substance', value.control_substance)
      setValue('unit_price', value.unit_price)
    }

    checkTotalCount()
  }

  const handleBatchChange = (value, index) => {
    setValue(`product_batches[${index}].request_item_batch_no`, value)
    setValue(`product_batches[${index}].expiry_date`, value?.expiry_date || '')
    setValue(`product_batches[${index}].available_item_qty`, value?.available_item_qty || '')
    setValue(`product_batches[${index}].multiplier`, value?.multiplier || '')
    setValue(`product_batches[${index}].variant_id`, value?.variant_id || '')
    setValue(`product_batches[${index}].unit_price`, value?.unit_price || '')
    setValue(`product_batches[${index}].request_item_qty`, '')
    clearErrors(`product_batches[${index}].request_item_batch_no`)
    clearErrors(`product_batches[${index}].request_item_qty`)
    checkTotalCount()

    // Trigger validation for this specific field
    trigger(`product_batches[${index}].request_item_batch_no`)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <Grid container rowSpacing={4} columnSpacing={2} size={{ xs: 12, sm: 12 }}>
        <Grid item size={{ xs: 12, sm: 12, lg: 12 }}>
          <ControlledAutocomplete
            name='request_item'
            label='Search by Product Name*'
            control={control}
            errors={errors}
            options={productList}
            loading={productLoading}
            required
            defaultValue={null}
            onChangeOverride={value => handleProductSelection(value)}
            onKeyUp={e => searchMedicineData(e.target.value)}
            onBlur={async () =>
              await searchMedicineData(nestedMedicine?.request_item_medicine_id, nestedMedicine.stock_type)
            }
            onItemClear={() => handleProductSelection(null, true)}
            renderOption={(props, option) => <ProductOption option={option} unitPrice={option.unit_price} {...props} />}
          />

          <ProductDetailsCard
            packageDetails={watch('packageDetails')}
            manufacture={watch('manufacture')}
            unitPrice={watch('unit_price')}
            totalAvailableCount={totalAvailableCount}
            batchLoading={batchLoading}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 12 }}>
          <Typography variant='subtitle1'>
            {getValues('stock_type') === 'non_medical' ? 'Batch No' : 'Batch No and Expiry Date'}
          </Typography>
        </Grid>
        {fields.map((field, index) => (
          <Grid
            key={field.id || index} // Use field.id if available, otherwise use index
            container
            size={{ xs: 12, sm: 12 }}
            spacing={4}
            sx={{
              bgcolor: theme.palette.customColors.mdAntzNeutral,
              padding: 4,
              borderRadius: 1,
              width: '100%',
              display: 'flex'
            }}
          >
            <Grid
              item
              size={{ xs: 12, sm: getValues('stock_type') === 'non_medical' ? (isEdit ? 4 : 3.4) : isEdit ? 3 : 2.5 }}
              sm={getValues('stock_type') === 'non_medical' ? 6 : 4}
            >
              <ControlledAutocomplete
                name={`product_batches[${index}].request_item_batch_no`}
                label='Enter Batch No*'
                control={control}
                errors={errors}
                options={batchList || []}
                loading={batchLoading}
                isOptionEqualToValue={(option, value) => option.value === value?.value}
                getOptionLabel={option => option.label || ''}
                required
                onChangeOverride={value => handleBatchChange(value, index)}
                sx={{ backgroundColor: 'white', borderRadius: '8px' }}
                renderOption={(props, option) => <BatchOption option={option} {...props} />}
                formHelperTextBackgroundColor={theme.palette.customColors.mdAntzNeutral}
              />
            </Grid>
            <Grid
              item
              size={{ xs: 12, sm: getValues('stock_type') === 'non_medical' ? (isEdit ? 4 : 3.4) : isEdit ? 3 : 2.5 }}
            >
              <ControlledTextField
                name={`product_batches[${index}].multiplier`}
                label='Product Variant'
                control={control}
                errors={errors}
                required
                disabled
                sx={{ backgroundColor: 'white', borderRadius: '8px' }}
              />
            </Grid>
            {getValues('stock_type') === 'non_medical' ? null : (
              <Grid item size={{ xs: 12, sm: isEdit ? 3 : 2.5 }}>
                <ControlledTextField
                  name={`product_batches[${index}].expiry_date`}
                  label='Expiry Date*'
                  control={control}
                  errors={errors}
                  required
                  readOnly
                  sx={{ backgroundColor: 'white', borderRadius: '8px' }}
                />
              </Grid>
            )}

            <Grid
              item
              size={{ xs: 12, sm: getValues('stock_type') === 'non_medical' ? (isEdit ? 4 : 3.4) : isEdit ? 3 : 2.5 }}
            >
              <ControlledTextField
                name={`product_batches[${index}].request_item_qty`}
                label='Quantity*'
                type='number'
                control={control}
                errors={errors}
                required
                onKeyDown={checkTotalCount}
                onPaste={checkTotalCount}
                onInput={checkTotalCount}
                onChangeOverride={checkTotalCount}
                sx={{ backgroundColor: 'white', borderRadius: '8px' }}
                formHelperTextBackgroundColor={theme.palette.customColors.mdAntzNeutral}
              />
            </Grid>
            {!isEdit && (
              <Grid
                item
                size={{ xs: 12, sm: 1.6, md: 1.6 }}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
              >
                {handleAddRemoveSalts(fields, index)}
              </Grid>
            )}
          </Grid>
        ))}
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
  )
}
