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
  manufacture: '',
  purchase_variant_id: '',
  purchase_unit_qty: 0,
  purchase_variant_ratio: '',
  isVariantIdPresent: false
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
    expiryDateLoader,
    getProductVariantByproductId,
    productVariantOptions,
    setProductVariantOptions
  } = props

  const [defaultProduct, setDefaultProduct] = useState({ label: '', value: '', stock_type: '' })
  console.log('first,', nestedRowMedicine)

  const schema = yup.object().shape({
    // product: yup.string().required('Product name is required'),
    product: yup
      .object()
      .shape({
        label: yup.string().required('Product Name is required'),
        value: yup.string().required('Product Name is required'),
        stock_type: yup.string().nullable()
      })
      .required('Product Name is required'),

    purchase_expiry_date: yup
      .mixed()
      .transform((value, originalValue) => {
        return originalValue === '' ? null : value
      })
      .when('product.stock_type', (stockType, schema) => {
        if (stockType === 'non_medical') {
          return schema.notRequired()
        }

        return yup.date().typeError('Select a valid expiry date').required('Expiry date is required')
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
      .required('Purchase quantity is required'),
    purchase_variant_id: yup.string().required('Product variant is required')
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
      manufacture,
      purchase_variant_id,
      purchase_unit_qty,
      purchase_variant_ratio,
      isVariantIdPresent

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
      manufacture,
      purchase_variant_id,
      purchase_unit_qty,
      purchase_variant_ratio,
      isVariantIdPresent
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
    const totalUnitQty = checkNumber(updatedValues?.purchase_variant_ratio * purchase_qty)

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
    setValue('purchase_unit_qty', totalUnitQty)

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
      setValue('purchase_expiry_date', dayjs(productExpiryDate), { shouldValidate: true })
      if (nestedRowMedicine?.purchase_variant_id != 0)
        setValue('purchase_variant_id', nestedRowMedicine?.purchase_variant_id, { shouldValidate: true })
      else setValue('purchase_variant_id', nestedRowMedicine?.purchase_variant_id)
      setValue('purchase_variant_ratio', nestedRowMedicine?.purchase_variant_ratio)
      const totalUnitQty = checkNumber(nestedRowMedicine?.purchase_variant_ratio * nestedRowMedicine?.purchase_qty)
      setValue('isVariantIdPresent', true)
      setValue('purchase_unit_qty', totalUnitQty)
    } else {
      setValue('purchase_expiry_date', '')
      setValue('purchase_variant_id', '')
      setValue('purchase_variant_ratio', '')
      setValue('isVariantIdPresent', false)
      setValue('purchase_unit_qty', nestedRowMedicine?.purchase_qty)
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
      setValue('purchase_variant_id', nestedRowMedicine?.purchase_variant_id)
      setValue('purchase_variant_ratio', nestedRowMedicine?.purchase_variant_ratio)
      setValue('isVariantIdPresent', nestedRowMedicine?.isVariantIdPresent)
      if (nestedRowMedicine.stock_type === 'non_medical') {
        setNonMedicalProduct(true)
      }

      setValue('purchase_expiry_date', dayjs(nestedRowMedicine.purchase_expiry_date))
    } else {
      setValue('purchase_expiry_date', null)
      setValue('package_details', '')
      setValue('manufacture', ''), setValue('purchase_variant_id', ''), setValue('isVariantIdPresent', false)
      setValue('purchase_variant_ratio', '')
      searchMedicineData('')
    }
  }, [])

  return (
    <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={5}>
        <Grid item size={{ xs: 12, sm: 6 }}>
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
                      setValue('purchase_batch_no', '', { shouldValidate: true })
                      setValue('purchase_expiry_date', null, { shouldValidate: true })
                      setValue('package_details', '')
                      setValue('manufacture', '')
                      setValue('purchase_variant_id', '', { shouldValidate: true })
                      setProductVariantOptions([])
                      setValue('isVariantIdPresent', false)

                      return onChange(null)
                    } else {
                      if (val.stock_type === 'non_medical') {
                        setNonMedicalProduct(true)
                        setValue('package_details', val?.package_details)
                        setValue('manufacture', val?.manufacture)
                        setValue('purchase_expiry_date', dayjs(Date()), { shouldValidate: true })
                        setProductVariantOptions([])
                        setValue('purchase_variant_id', '', { shouldValidate: true })
                        getProductVariantByproductId(val?.value)
                      } else {
                        setNonMedicalProduct(false)
                        setValue('package_details', val?.package_details)
                        setValue('manufacture', val?.manufacture)
                        setProductVariantOptions([])
                        getProductVariantByproductId(val?.value)
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
            {errors.product && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.product?.value?.message}</FormHelperText>
            )}
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
        <Grid item size={{ xs: 12, sm: 6 }}>
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

                      if (product?.product?.value !== '' && e?.target?.value !== '') {
                        field?.onBlur()
                        checkMedicineExpiryDate(product?.product?.value, e.target.value)
                      } else {
                        setValue('purchase_qty', '')
                        setValue('purchase_unit_qty', '')
                        setValue('purchase_variant_id', '', { shouldValidate: true })
                        setValue('purchase_variant_ratio', ''), setValue('isVariantIdPresent', false)
                      }
                    }
                  }}
                />
              )}
            />
          </FormControl>
        </Grid>

        {!nonMedicalProduct && (
          <Grid item size={{ xs: 12, sm: 6 }}>
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
                      renderInput={params => <TextField {...params} error={Boolean(errors.purchase_expiry_date)} />}
                      slotProps={{
                        textField: {
                          error: Boolean(errors.purchase_expiry_date)
                        }
                      }}
                      error={Boolean(errors.purchase_expiry_date)}
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

        <Grid item size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <Controller
              error={Boolean(errors.purchase_unit_price)}
              name='purchase_qty'
              control={control}
              render={({ field }) => (
                <TextField
                  error={Boolean(errors.purchase_qty)}
                  {...field}
                  label='Purchase Quantity*'
                  onKeyUp={e => {
                    calculateStuff()
                  }}

                  // helperText={errors.purchase_unit_price?.message}
                />
              )}
            />
            {errors.purchase_qty && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_qty?.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel error={Boolean(errors.purchase_variant_id)}>Product Variant*</InputLabel>
            <Controller
              name='purchase_variant_id'
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, value, ...rest } }) => (
                <Select
                  {...rest}
                  disabled={watch('isVariantIdPresent') === true || nestedRowMedicine?.id ? true : false}
                  value={value}
                  onChange={(e, val) => {
                    setValue('purchase_variant_ratio', Number(val?.props?.children))
                    console.log('variant ratio', Number(val?.props?.children))
                    const purchaseQty = watch('purchase_qty')

                    const totalUnitQty = purchaseQty
                      ? purchaseQty * Number(val?.props?.children)
                      : Number(val?.props?.children) * 1
                    setValue('purchase_unit_qty', totalUnitQty)

                    // setValue('purchase_qty', '')
                    onChange(e)
                  }}
                  label='Product Variant*'
                  error={Boolean(errors.purchase_variant_id)}
                >
                  {productVariantOptions?.length > 0 ? (
                    productVariantOptions?.map((item, index) => (
                      <MenuItem key={index} value={item.value}>
                        {item?.label}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem>No Options</MenuItem>
                  )}
                </Select>
              )}
            />
            {errors?.purchase_variant_id && <FormHelperText error>{errors.purchase_variant_id.message}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: 'customColors.neutral05',
              display: 'flex',
              justifyContent: 'start',
              alignItems: 'center',
              px: '16px',
              borderRadius: '8px',
              height: '56px'
            }}
          >
            {/* <Controller
                      name='purchase_unit_qty'
                      control={control}
                      render={({ field }) => (
                        <TextField
                          disabled={true}
                          {...field}
                          value={field.value === 0 ? '' : field.value}
                          label='Purchase Unit Quantity*'
                          onKeyUp={e => {
                            calculateStuff()
                          }}
                          error={Boolean(errors.purchase_unit_qty)}

                          // helperText={errors.purchase_unit_price?.message}
                        />
                      )}
                    />
                    {errors.purchase_unit_qty && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors?.purchase_unit_qty?.message}</FormHelperText>
                    )} */}
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'customColors.neutralPrimary',
                mb: 0.5
              }}
            >
              Total Quantity-
              {productVariantOptions?.length > 0 && watch('purchase_variant_ratio')
                ? watch('purchase_unit_qty')
                : watch('purchase_qty')}
            </Typography>
          </Box>
        </Grid>

        {/* // file uploader */}
        <Grid item size={{ xs: 12 }}>
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
