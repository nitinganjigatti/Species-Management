import React, { useEffect, useState } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CustomInput,
  TextField,
  Autocomplete,
  Grid,
  Box,
  Button,
  CircularProgress
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useForm, Controller } from 'react-hook-form'

// import DatePicker from 'react-datepicker'
import SingleDatePicker from 'src/components/SingleDatePicker'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import Icon from 'src/@core/components/icon'
import InputAdornment from '@mui/material/InputAdornment'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { getValue } from '@mui/system'
import Utility from 'src/utility'
import dayjs from 'dayjs'

const defaultValues = {
  product: {
    label: '',
    value: '',
    stock_type: ''
  },
  purchase_batch_no: '',
  purchase_expiry_date: null,
  purchase_unit_price: 0,
  purchase_qty: 0,
  purchase_free_quantity: 0,
  purchase_discount: 0,
  purchase_cgst: 0,
  purchase_sgst: 0,
  purchase_igst: 0,
  purchase_cgst_amount: 0,
  purchase_sgst_amount: 0,
  purchase_igst_amount: 0,
  purchase_gross_amount: 0,
  purchase_discount_amount: 0,
  purchase_taxable_amount: 0,
  purchase_net_amount: 0
}

const PurchaseItemForm = props => {
  const {
    submitLoader,
    optionsMedicineList,
    searchMedicineData,
    medicineItemId,
    submitItems,
    nestedRowMedicine,
    updateFormItems,
    purchase_details,
    checkMedicineExpiryDate,
    productExpiryDate,
    expiryDateLoader
  } = props

  const [defaultProduct, setDefaultProduct] = useState({ label: '', value: '', stock_type: '' })

  const schema = yup.object().shape({
    // product: yup.string().required('Product name is required'),
    product: yup.object().shape({
      value: yup.string().required('Product name is required'),
      label: yup.string().required('Product name is required'),
      stock_type: yup.string().nullable()
    }),

    // purchase_expiry_date: yup.date().typeError('Select valid expiry date').required('Expiry date is required'),
    purchase_expiry_date: yup
      .date()
      .typeError('Select a valid expiry date')
      .when(['product.stock_type'], (stockType, schema) => {
        return stockType === 'non medical' ? schema : schema.required('Expiry date is required')
      }),
    purchase_batch_no: yup
      .string()
      .test('is-unique', 'Product with same batch exist', function (value, { parent }) {
        console.log(purchase_details)

        const isDuplicate = purchase_details?.some(
          (entry, index) =>
            index !== (medicineItemId ? nestedRowMedicine?.index : -1) &&
            entry.purchase_unit_id === parent?.product?.value &&
            entry.purchase_batch_no === value
        )

        return !isDuplicate
      })
      .required('Batch number is required'),

    purchase_unit_price: yup
      .number()
      .typeError('Supplier rate must be a number')
      .positive('Supplier rate must be a positive number')
      .required('Supplier rate is required'),
    purchase_qty: yup
      .number()
      .typeError('Purchase quantity must be a number')
      .min(1, 'Purchase quantity must be greater than zero')
      .required('Purchase quantity is required'),

    // purchase_qty: yup.string().required('Purchase quantity is required'),
    // purchase_purchase_price: yup.string().required('Total purchase price is required'),
    // purchase_free_quantity: yup
    //   .number()
    //   .typeError('Free quantity must be a number')
    //   .min(0, 'Free quantity must be greater than zero'),
    purchase_discount: yup
      .number()
      .typeError('Discount must be a number')
      .min(0, 'Discount must be greater than zero')
      .required('Discount is required'),
    purchase_cgst: yup
      .number()
      .typeError('Central GST must be a number')
      .min(0, 'Central GST must be greater than zero')
      .required('Central GST is required'),
    purchase_sgst: yup
      .number()
      .typeError('State GST must be a number')
      .min(0, 'State GST must be greater than zero')
      .required('State GST is required'),
    purchase_igst: yup
      .number()
      .typeError('GST must be a number')
      .min(0, 'GST must be greater than zero')
      .required('GST is required'),

    // purchase_cgst_amount: yup
    //   .number()
    //   .typeError('Central GST Amount must be a number')
    //   .min(1, 'Central GST Amount must be greater than zero')
    //   .required('Central GST Amount is required'),

    purchase_cgst_amount: yup
      .number()
      .typeError('Central GST Amount must be a number')

      // .positive('Central GST Amount must be a positive number')
      .required('Central GST Amount is required'),

    // purchase_sgst_amount: yup
    //   .number()
    //   .typeError('State GST Amount must be a number')
    //   .min(1, 'State GST Amount must be greater than zero')
    //   .required('State GST Amount is required'),

    purchase_sgst_amount: yup
      .number()
      .typeError('State GST Amount must be a number')

      // .positive('State GST Amount must be a positive number')
      .required('State GST Amount is required'),

    purchase_igst_amount: yup
      .number()
      .typeError('Tax Amount must be a number')

      // .positive('Tax Amount must be a positive zero')
      .required('Tax Amount is required'),

    // purchase_igst_amount: yup
    //   .number()
    //   .typeError('Tax Amount must be a number')
    //   .min(1, 'Tax Amount must be greater than zero')
    //   .required('Tax Amount is required'),

    purchase_gross_amount: yup
      .number()
      .typeError('Gross amount must be a number')
      .positive('Gross amount must be a positive number')
      .required('Gross amount is required'),

    purchase_discount_amount: yup
      .number()
      .typeError('Purchase discount amount must be a number')
      .min(0, 'Purchase discount amount must be greater than zero'),

    purchase_taxable_amount: yup
      .number()
      .typeError('Taxable amount must be a number')

      // .positive('Taxable amount amount must be greater than zero')
      .required('Taxable amount is required'),

    purchase_net_amount: yup
      .number()
      .typeError('Net amount must be a number')

      // .positive('Net amount amount must be greater than zero')
      .required('Net amount is required')
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    context: {
      previousEntries: purchase_details,
      editingIndex: medicineItemId ? nestedRowMedicine?.index : -1
    }
  })

  // const watchFields = watch([
  //   'purchase_unit_price',
  //   'purchase_qty',
  //   'purchase_discount',
  //   'purchase_free_quantity',
  //   'purchase_gst'
  // ])

  const [nonMedicalProduct, setNonMedicalProduct] = useState(false)

  const onSubmit = async params => {
    const {
      product,
      purchase_batch_no,
      purchase_expiry_date,
      purchase_unit_price,
      purchase_qty,
      purchase_free_quantity,
      purchase_discount,
      purchase_cgst,
      purchase_sgst,
      purchase_igst,
      purchase_cgst_amount,
      purchase_sgst_amount,
      purchase_igst_amount,
      purchase_gross_amount,
      purchase_discount_amount,
      purchase_taxable_amount,
      purchase_net_amount

      // purchase_purchase_price,
    } = params
    console.log(params)

    const { value, label, stock_type } = product

    // const purchase_discount_amount = calculateDiscountAmount(purchase_purchase_price, purchase_discount)

    const payload = {
      medicine_name: label,
      purchase_unit_id: value,
      purchase_stock_item_id: value,
      purchase_batch_no,
      purchase_expiry_date: stock_type !== 'non_medical' ? Utility.formatDate(purchase_expiry_date) : '',
      purchase_unit_price,
      purchase_qty,
      purchase_free_quantity,
      purchase_discount,
      purchase_cgst,
      purchase_sgst,
      purchase_igst,
      purchase_cgst_amount,
      purchase_sgst_amount,
      purchase_igst_amount,
      purchase_gross_amount,
      purchase_discount_amount,
      purchase_taxable_amount,
      purchase_net_amount,
      stock_type: stock_type,
      purchase_purchase_price: purchase_net_amount
    }

    submitItems(payload)

    // await handleSubmitData(payload)
  }

  function calculateDiscountAmount(originalPrice, discountPercentage) {
    const discountAmount = (originalPrice * discountPercentage) / 100

    return discountAmount
  }

  function calculateAmountAfterDiscount(originalPrice, discountPercentage) {
    const discountAmount = (originalPrice * discountPercentage) / 100

    return originalPrice - discountAmount
  }

  function checkNumber(numberToCheck) {
    return parseFloat(numberToCheck?.toString().length > 0 && !isNaN(numberToCheck) ? numberToCheck : 0)
  }

  const checkFloatValue = value => {
    if (value >= 0.01) {
      return parseFloat(value).toFixed(2)
    } else if (value > 0 && value < 0.01) {
      return parseFloat(value).toFixed(5)
    } else {
      return 0
    }
  }

  const calculateStuff = () => {
    const updatedValues = getValues()

    const unit_price = checkNumber(updatedValues.purchase_unit_price)

    const purchase_qty = checkNumber(updatedValues.purchase_qty)

    const purchase_discount = checkNumber(updatedValues.purchase_discount)

    const purchase_free_quantity = checkNumber(updatedValues.purchase_free_quantity)

    const purchase_cgst = checkNumber(updatedValues.purchase_cgst)

    const purchase_sgst = checkNumber(updatedValues.purchase_sgst)

    const purchase_igst = purchase_cgst + purchase_sgst

    // const purchase_igst = checkNumber(updatedValues.purchase_igst)

    const totalPurchasedQty = purchase_qty - purchase_free_quantity

    const grossAmount = totalPurchasedQty * unit_price

    const totalAmountAfterDiscount = calculateAmountAfterDiscount(grossAmount, purchase_discount)

    const purchase_igst_amount = parseFloat(totalAmountAfterDiscount * (purchase_igst / 100))

    const purchase_cgst_amount = parseFloat(totalAmountAfterDiscount * (purchase_cgst / 100))

    const purchase_sgst_amount = parseFloat(totalAmountAfterDiscount * (purchase_sgst / 100))

    const discountAmount = calculateDiscountAmount(grossAmount, purchase_discount)

    const taxableAmount = calculateAmountAfterDiscount(grossAmount, purchase_discount)

    const netAmount = taxableAmount + purchase_igst_amount

    // const grandTotal = parseFloat(grossAmount).toFixed(2)

    // console.log('taxAmount', taxAmount)
    setValue(
      'purchase_cgst_amount',
      checkFloatValue(purchase_cgst_amount)

      // purchase_cgst_amount >= 0.01
      //   ? parseFloat(purchase_cgst_amount).toFixed(2)
      //   : parseFloat(purchase_cgst_amount).toFixed(5)
    )
    setValue(
      'purchase_sgst_amount',
      checkFloatValue(purchase_sgst_amount)

      // purchase_sgst_amount >= 0.01
      //   ? parseFloat(purchase_sgst_amount).toFixed(2)
      //   : parseFloat(purchase_sgst_amount).toFixed(5)
    )
    setValue(
      'purchase_igst',
      checkFloatValue(purchase_igst)

      // purchase_igst >= 0.01 ? parseFloat(purchase_igst).toFixed(2) : parseFloat(purchase_igst).toFixed(5)
    )
    setValue(
      'purchase_igst_amount',
      checkFloatValue(purchase_igst_amount)

      // purchase_igst_amount >= 0.01
      //   ? parseFloat(purchase_igst_amount).toFixed(2)
      //   : parseFloat(purchase_igst_amount).toFixed(5)
    )
    setValue(
      'purchase_gross_amount',
      checkFloatValue(grossAmount)

      // grossAmount >= 0.01 ? parseFloat(grossAmount).toFixed(2) : parseFloat(grossAmount).toFixed(5)
    )
    setValue(
      'purchase_discount_amount',
      checkFloatValue(discountAmount)

      // discountAmount >= 0.01 ? parseFloat(discountAmount).toFixed(2) : parseFloat(discountAmount).toFixed(5)
    )
    setValue(
      'purchase_taxable_amount',
      checkFloatValue(taxableAmount)

      // taxableAmount >= 0.01 ? parseFloat(taxableAmount).toFixed(2) : parseFloat(taxableAmount).toFixed(2)
    )
    setValue(
      'purchase_net_amount',
      checkFloatValue(netAmount)

      // netAmount >= 0.01 ? parseFloat(netAmount).toFixed(2) : parseFloat(netAmount).toFixed(5)
    )
  }

  useEffect(() => {
    if (productExpiryDate !== '') {
      setValue('purchase_expiry_date', dayjs(productExpiryDate))
    }
  }, [productExpiryDate, expiryDateLoader])

  useEffect(() => {
    debugger
    if (nestedRowMedicine.medicine_name !== '') {
      console.log(optionsMedicineList)

      Object.keys(nestedRowMedicine).forEach(key => {
        if (key !== 'purchase_expiry_date') {
          setValue(key, nestedRowMedicine[key])
        }
      })

      setValue('product', {
        label: nestedRowMedicine.medicine_name,
        value: nestedRowMedicine.purchase_unit_id,
        stock_type: nestedRowMedicine.stock_type
      })

      if (nestedRowMedicine.stock_type === 'non_medical') {
        setNonMedicalProduct(true)
      }

      setValue('purchase_expiry_date', dayjs(nestedRowMedicine.purchase_expiry_date))
    } else {
      setValue('purchase_expiry_date', null)
      searchMedicineData('')
    }
  }, [])

  return (
    <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={5}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='product'
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  options={optionsMedicineList}
                  value={value}
                  getOptionLabel={option => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  onChange={(e, val) => {
                    if (val === null) {
                      setValue('purchase_batch_no', '')
                      setValue('purchase_expiry_date', null)

                      return onChange(null)
                    } else {
                      if (val.stock_type === 'non_medical') {
                        setNonMedicalProduct(true)
                        setValue('purchase_expiry_date', dayjs(Date()))
                      } else {
                        setNonMedicalProduct(false)
                      }

                      return onChange(val)
                    }
                  }}
                  onBlur={e => {
                    if (!nonMedicalProduct) {
                      const product = getValues()
                      if (product?.product?.value !== '' && product?.purchase_batch_no !== '') {
                        checkMedicineExpiryDate(product?.product?.value, product?.purchase_batch_no)
                      }
                    }
                  }}
                  onKeyUp={e => {
                    searchMedicineData(e.target.value)
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Product Name*'
                      error={Boolean(errors.product)}
                      helperText={errors.product?.message}
                    />
                  )}
                />
              )}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_batch_no'
              control={control}
              defaultValue=''
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Batch Number*'
                  error={Boolean(errors.purchase_batch_no)}
                  helperText={errors.purchase_batch_no?.message}
                  onBlur={e => {
                    if (!nonMedicalProduct) {
                      const product = getValues()
                      if (product?.product?.value !== '' && e.target.value !== '') {
                        field?.onBlur()
                        checkMedicineExpiryDate(product?.product?.value, e.target.value)
                      }
                    }
                  }}
                />
              )}
            />
          </FormControl>
        </Grid>

        {!nonMedicalProduct && (
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              {expiryDateLoader && (
                <span style={{ position: 'absolute', right: '12px', top: '16px' }}>
                  <CircularProgress size={20} />
                </span>
              )}
              <Controller
                name='purchase_expiry_date'
                control={control}
                render={({ field: { value, onChange } }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DesktopDatePicker
                      label='Expiry Date*'
                      inputFormat='MM/DD/YYYY'
                      value={value}
                      onChange={onChange}
                      renderInput={params => <TextField {...params} />}
                      error={Boolean(errors.purchase_expiry_date)}
                      helperText={errors.purchase_expiry_date?.message}
                    />
                  </LocalizationProvider>
                )}
              />
              {/* disabled={expiryDateLoader} */}
              {errors.purchase_expiry_date && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_expiry_date?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_unit_price'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  label='Supplier Rate*'
                  error={Boolean(errors.purchase_unit_price)}

                  // helperText={errors.purchase_unit_price?.message}
                />
              )}
            />
            {errors.purchase_unit_price && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_unit_price?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_qty'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Purchase Quantity*'
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  error={Boolean(errors.purchase_unit_price)}

                  // helperText={errors.purchase_unit_price?.message}
                />
              )}
            />
            {errors.purchase_qty && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_qty?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_free_quantity'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Free Quantity'
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  error={Boolean(errors.purchase_free_quantity)}

                  //helperText={errors.purchase_free_quantity?.message}
                />
              )}
            />
            {errors.purchase_free_quantity && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_free_quantity?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid> */}

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_discount'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  label='Discount in %'
                  error={Boolean(errors.purchase_discount)}

                  //helperText={errors.purchase_discount?.message}
                />
              )}
            />
            {errors.purchase_discount && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_discount?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_cgst'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Central GST in %*'
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  error={Boolean(errors.purchase_cgst)}

                  // helperText={errors.purchase_gst?.message}
                />
              )}
            />
            {errors.purchase_cgst && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_cgst?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_sgst'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='State GST in %*'
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  error={Boolean(errors.purchase_sgst)}

                  // helperText={errors.purchase_gst?.message}
                />
              )}
            />
            {errors.purchase_sgst && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_sgst?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_cgst_amount'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={true}
                  label='Central GST Amount*'
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  error={Boolean(errors.purchase_cgst_amount)}

                  // helperText={errors.purchase_gst?.message}
                />
              )}
            />
            {errors.purchase_cgst_amount && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_cgst_amount?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_sgst_amount'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={true}
                  label='State GST Amount*'
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  error={Boolean(errors.purchase_sgst_amount)}

                  // helperText={errors.purchase_gst?.message}
                />
              )}
            />
            {errors.purchase_sgst_amount && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_sgst_amount?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_igst'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  disabled={true}
                  label='GST in %*'
                  onKeyUp={e => {
                    calculateStuff()
                  }}
                  error={Boolean(errors.purchase_igst)}

                  // helperText={errors.purchase_gst?.message}
                />
              )}
            />
            {errors.purchase_igst && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_igst?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_igst_amount'
              control={control}
              defaultValue=''
              render={({ field }) => (
                <TextField
                  disabled={true}
                  {...field}
                  label='Tax Amount'
                  error={Boolean(errors.purchase_igst_amount)}
                  helperText={errors.purchase_igst_amount?.message}
                />
              )}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_gross_amount'
              control={control}
              defaultValue=''
              render={({ field }) => (
                <TextField
                  disabled={true}
                  {...field}
                  label='Gross Amount*'
                  error={Boolean(errors.purchase_gross_amount)}

                  // helperText={errors.purchase_purchase_price?.message}
                />
              )}
            />
            {errors.purchase_gross_amount && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_gross_amount?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_discount_amount'
              control={control}
              defaultValue=''
              render={({ field }) => (
                <TextField
                  disabled={true}
                  {...field}
                  label='Discount Amount*'
                  error={Boolean(errors.purchase_discount_amount)}

                  // helperText={errors.purchase_purchase_price?.message}
                />
              )}
            />
            {errors.purchase_discount_amount && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_discount_amount?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_taxable_amount'
              control={control}
              defaultValue=''
              render={({ field }) => (
                <TextField
                  disabled={true}
                  {...field}
                  label='Taxable Amount*'
                  error={Boolean(errors.purchase_taxable_amount)}

                  // helperText={errors.purchase_purchase_price?.message}
                />
              )}
            />
            {errors.purchase_taxable_amount && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_taxable_amount?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <Controller
              name='purchase_net_amount'
              control={control}
              defaultValue=''
              render={({ field }) => (
                <TextField
                  disabled={true}
                  {...field}
                  label='Net Amount*'
                  error={Boolean(errors.purchase_net_amount)}

                  // helperText={errors.purchase_purchase_price?.message}
                />
              )}
            />
            {errors.purchase_net_amount && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_net_amount?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/*
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <TextField
              type='Number'
              value={nestedRowMedicine.purchase_unit_price}
              error={Boolean(itemErrors.purchase_unit_price)}
              label='Supplier Rate*'
              onChange={onchange}
            />
            {itemErrors.purchase_unit_price && (
              <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                {itemErrors.purchase_unit_price}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            {console.log('nestedRowMedicine.purchase_qty', nestedRowMedicine.purchase_qty)}
            <TextField
              type='number'
              value={nestedRowMedicine.purchase_qty}
              error={Boolean(itemErrors.purchase_qty)}
              label='Quantity*'
              onChange={onchange}
            />
            {itemErrors.purchase_qty && (
              <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                {itemErrors.purchase_qty}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <TextField
              type='Number'
              disabled={true}
              value={value}
              error={Boolean(itemErrors.purchase_purchase_price)}
              label='Total purchase price'
              onChange={onchange}
            />
            {itemErrors.purchase_purchase_price && (
              <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                This field is required
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        {nestedRowMedicine.purchase_gst_type ? (
          <>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  type='text'
                  disabled={true}
                  value={value}
                  error={Boolean(itemErrors.purchase_gst_type)}
                  label='GST'
                  onChange={value}
                />
                {itemErrors.purchase_gst_type && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  type='number'
                  disabled={true}
                  value={value}
                  error={Boolean(itemErrors.purchase_tax_amount)}
                  label='Tax amount'
                  onChange={onchange}
                />
                {itemErrors.purchase_tax_amount && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          </>
        ) : null} */}

        {/* <Box sx={{ height: '150px' }}></Box> */}

        {/* // file uploader */}
        <Grid item xs={12}>
          <Box sx={{ float: 'right' }}>
            {medicineItemId ? (
              <>
                <Button sx={{ mr: 2 }} type='submit' size='large' variant='contained'>
                  update
                </Button>
                <Button
                  onClick={() => {
                    reset(defaultValues)
                  }}
                  size='large'
                  variant='outlined'
                >
                  Reset
                </Button>
              </>
            ) : (
              <>
                <Button sx={{ mr: 2 }} type='submit' size='large' variant='contained'>
                  save
                </Button>
                <Button
                  onClick={() => {
                    reset(defaultValues)
                  }}
                  size='large'
                  variant='outlined'
                >
                  Reset
                </Button>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </form>
  )
}

export default PurchaseItemForm
