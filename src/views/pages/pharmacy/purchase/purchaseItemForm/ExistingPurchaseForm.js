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
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { useForm, Controller } from 'react-hook-form'

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
  purchase_net_amount: 0,
  package_details: '',
  manufacture: ''
}

const ExistingPurchaseForm = props => {
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
  console.log('first,', nestedRowMedicine)

  const schema = yup.object().shape({
    // product: yup.string().required('Product name is required'),
    product: yup.object().shape({
      value: yup.string().required('Product name is required'),
      label: yup.string().required('Product name is required'),
      stock_type: yup.string().nullable()
    }),

    purchase_expiry_date: yup.string().when('[product.stock_type]', (stockType, schema) => {
      const result =
        stockType[0] === 'non_medical' ? yup.string().notRequired() : yup.date().typeError('Select a valid expiry date')

      return result
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

    // purchase_unit_price: yup
    //   .number()
    //   .typeError('Supplier rate must be a number')
    //   .positive('Supplier rate must be a positive number')
    //   .required('Supplier rate is required'),
    purchase_qty: yup
      .number()
      .typeError('Purchase quantity must be a number')
      .min(1, 'Purchase quantity must be greater than zero')
      .required('Purchase quantity is required')
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
      purchase_net_amount,
      package_details,
      manufacture

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
      purchase_purchase_price: purchase_net_amount,
      package_details,
      manufacture
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

    const purchase_igst = checkNumber(updatedValues.purchase_igst)

    const totalPurchasedQty = purchase_qty - purchase_free_quantity

    const grossAmount = totalPurchasedQty * unit_price

    const totalAmountAfterDiscount = calculateAmountAfterDiscount(grossAmount, purchase_discount)

    const purchase_igst_amount = parseFloat(totalAmountAfterDiscount * (purchase_igst / 100))

    const purchase_cgst_amount = parseFloat(totalAmountAfterDiscount * (purchase_cgst / 100))

    const purchase_sgst_amount = parseFloat(totalAmountAfterDiscount * (purchase_sgst / 100))
    const purchase_gst = purchase_sgst + purchase_cgst
    const purchase_gst_amount = parseFloat(totalAmountAfterDiscount * (purchase_gst / 100))

    const discountAmount = calculateDiscountAmount(grossAmount, purchase_discount)

    const taxableAmount = calculateAmountAfterDiscount(grossAmount, purchase_discount)

    let netAmount
    if (purchase_igst_amount === 0 || purchase_igst_amount === '0') {
      netAmount = taxableAmount + purchase_gst_amount
    } else {
      netAmount = taxableAmount + purchase_igst_amount
    }

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

    // setValue(
    //   'purchase_igst',
    //   checkFloatValue(purchase_igst)

    //   // purchase_igst >= 0.01 ? parseFloat(purchase_igst).toFixed(2) : parseFloat(purchase_igst).toFixed(5)
    // )
    setValue(
      'purchase_igst_amount',
      checkFloatValue(purchase_igst_amount)

      // purchase_igst_amount >= 0.01
      //   ? parseFloat(purchase_igst_amount).toFixed(2)
      //   : parseFloat(purchase_igst_amount).toFixed(5)
    )

    setValue(
      'purchase_gst',
      checkFloatValue(purchase_gst_amount)

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
      setValue('package_details', nestedRowMedicine?.package_details)
      setValue('manufacture', nestedRowMedicine?.manufacture)
      if (nestedRowMedicine.stock_type === 'non_medical') {
        setNonMedicalProduct(true)
      }

      setValue('purchase_expiry_date', dayjs(nestedRowMedicine.purchase_expiry_date))
    } else {
      setValue('purchase_expiry_date', null)
      setValue('package_details', '')
      setValue('manufacture', '')
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
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={{ opacity: option.status ? 1 : 0.5, pointerEvents: option.status ? 'auto' : 'none' }}
                    >
                      <Box>
                        <Typography>{option.label}</Typography>
                        <Typography variant='body2'>{option.package_details}</Typography>
                        <Typography variant='body2'>{option.manufacture}</Typography>
                      </Box>
                    </li>
                  )}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  onChange={(e, val) => {
                    if (val === null) {
                      setValue('purchase_batch_no', '')
                      setValue('purchase_expiry_date', null)
                      setValue('package_details', '')
                      setValue('manufacture', '')

                      return onChange(null)
                    } else {
                      if (val.stock_type === 'non_medical') {
                        setNonMedicalProduct(true)
                        setValue('package_details', val?.package_details)
                        setValue('manufacture', val?.manufacture)
                        setValue('purchase_expiry_date', dayjs(Date()))
                      } else {
                        setNonMedicalProduct(false)
                        setValue('package_details', val?.package_details)
                        setValue('manufacture', val?.manufacture)
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
            {watch('package_details') && (
              <Box sx={{ mx: 1, my: 2, display: 'flex' }}>
                <Chip
                  label={watch('package_details')}
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

        {/* // file uploader */}
        <Grid item xs={12}>
          <Box sx={{ float: 'right' }}>
            {medicineItemId ? (
              <>
                <Button sx={{ mr: 2 }} type='submit' size='large' variant='contained'>
                  update
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

export default ExistingPurchaseForm
