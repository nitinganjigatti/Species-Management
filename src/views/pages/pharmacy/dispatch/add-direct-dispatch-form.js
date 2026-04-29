import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Grid, Button, Typography, Paper, Box } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoaderIcon } from 'react-hot-toast'
import RenderUtility from 'src/utility/render'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'
import CustomChip from 'src/@core/components/mui/chip'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'

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
  //     debugger

  //     return (
  //       value !== null && typeof value === 'object' && 'label' in value && 'value' in value && 'expiry_date' in value
  //     )
  //   }),
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

    const available_qty = parseInt(totalQuantity)

    //  - (totalCount - nestedItemQuantity + enteredCount)

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
        <Grid container rowSpacing={4} columnSpacing={2} size={{ xs: 12, sm: 12 }}>
          <Grid item size={{ xs: 12, sm: 12, lg: 12 }}>
            <ControlledAutocomplete
              name='request_item'
              label='Search by Product Name*'
              control={control}
              errors={errors}
              options={productList}
              loading={productLoading}
              required={true}
              showIcons={false}
              onKeyUp={e => searchMedicineData(e.target.value)}
              onChangeOverride={value => {
                if (value === null || value?.status === 0) {
                  setValue('request_item', null, { shouldValidate: true })
                  setValue('request_item_batch_no', '', { shouldValidate: true })
                  setValue('expiry_date', '', { shouldValidate: true })
                  setValue('available_item_qty', '')
                  setValue('stock_type', '')
                  setValue('packageDetails', '')
                  setValue('manufacture', '')
                  setValue('unit_price', '')

                  return
                }
                setQuantityError(false)
                searchBatchData(value.value, value.stock_type)
                setValue('stock_type', value.stock_type)
                setValue('packageDetails', value.packageDetails)
                setValue('manufacture', value.manufacture)
                setValue('control_substance', value.control_substance)
                setValue('unit_price', value.unit_price)
                checkTotalCount()
              }}
              onItemClear={() => {
                setValue('request_item_batch_no', '', { shouldValidate: true })
                setValue('expiry_date', '', { shouldValidate: true })
                setValue('available_item_qty', '')
                setValue('stock_type', '')
                setValue('packageDetails', '')
                setValue('manufacture', '')
                setValue('unit_price', '')
              }}
              onBlur={async () => {
                await searchMedicineData(nestedMedicine?.request_item_medicine_id, nestedMedicine.stock_type)
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props

                return (
                  <li
                    key={`${option.value}-${option.label}`}
                    {...otherProps}
                    style={{ opacity: option.status ? 1 : 0.5, pointerEvents: option.status ? 'auto' : 'none' }}
                  >
                    <Box>
                      <Typography component='div'>{option.label}</Typography>
                      <Typography component='div' variant='body2'>
                        {option.packageDetails}
                      </Typography>
                      <Typography component='div' variant='body2'>
                        {option.manufacture}
                      </Typography>
                      {RenderUtility?.renderControlLabel(option.control_substance === true, 'CS')}
                      {option.prescription_required === true && (
                        <CustomChip label='PR' skin='light' color='success' size='small' />
                      )}
                    </Box>
                  </li>
                )
              }}
              textFieldProps={{
                placeholder: 'Search & Select'
              }}
            />

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
                      component='div'
                      sx={{
                        color: 'customColors.neutralSecondary',
                        fontWeight: 400,
                        fontFamily: 'Inter',
                        fontSize: '12px',
                        mb: 1
                      }}
                    >
                      Package:
                    </Typography>
                    <Typography
                      component='div'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                      sx={{
                        color: 'primary.light'
                      }}
                    >
                      {watch('packageDetails')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      component='div'
                      sx={{
                        color: 'customColors.neutralSecondary',
                        fontWeight: 400,
                        fontFamily: 'Inter',
                        fontSize: '12px',
                        mb: 1
                      }}
                    >
                      Manufactured by:
                    </Typography>
                    <Typography
                      component='div'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                      sx={{
                        color: 'primary.light'
                      }}
                    >
                      {watch('manufacture')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      component='div'
                      sx={{
                        color: 'customColors.neutralSecondary',
                        fontWeight: 400,
                        fontFamily: 'Inter',
                        fontSize: '12px'
                      }}
                    >
                      Availability:
                    </Typography>
                    <Typography
                      component='div'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                      sx={{
                        color: 'primary.light'
                      }}
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
                      component='div'
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
                </Box>
              </Paper>
            )}
          </Grid>
          <Grid item size={{ xs: 12, sm: 12 }}>
            <Typography variant='subtitle1'>
              {getValues('stock_type') === 'non_medical' ? 'Batch No' : 'Batch No and Expiry Date'}
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, sm: 3 }}>
            <ControlledAutocomplete
              name='request_item_batch_no'
              label={errors?.request_item_batch_no ? 'Enter Batch No*' : 'Enter Batch No'}
              control={control}
              errors={errors}
              options={batchList === undefined ? [] : batchList}
              loading={batchLoading}
              required={true}
              showIcons={false}
              onChangeOverride={value => {
                setValue('expiry_date', value?.expiry_date, { shouldValidate: true })
                setValue('available_item_qty', value?.available_item_qty)
                setValue('multiplier', value?.multiplier)
                setValue('variant_id', value?.variant_id)
                clearErrors('request_item_batch_no')
                setQuantityError(false)
                checkTotalCount()
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props

                return (
                  <Box
                    component='li'
                    key={`${option.value}-${option.label}`}
                    {...otherProps}
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
                        component='div'
                        sx={{
                          color: 'customColors.customHeadingTextColor',
                          fontWeight: 600
                        }}
                      >
                        {option.label}
                      </Typography>
                      <Typography
                        variant='body2'
                        component='div'
                        sx={{
                          color: 'customColors.neutralSecondary'
                        }}
                      >
                        Expiry Date: {Utility.formatDisplayDate(option.expiry_date)}
                      </Typography>
                      <Typography
                        variant='body2'
                        component='div'
                        sx={{
                          color: 'primary.main'
                        }}
                      >
                        Availability: {option.available_item_qty}
                      </Typography>
                    </Box>
                  </Box>
                )
              }}
              textFieldProps={{
                placeholder: 'Enter Batch No'
              }}
              autocompleteProps={{
                slots: {
                  paper: ({ children, ...props }) => (
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
                  )
                }
              }}
            />
            {getValues('available_item_qty') ? (
              <Typography sx={{ color: 'primary.main', fontSize: 14, mx: 2, my: { xs: 0, md: 1 } }}>
                Available Quantity:{getValues('available_item_qty')}
              </Typography>
            ) : null}
          </Grid>
          <Grid item size={{ xs: 12, sm: 3 }}>
            <ControlledTextField
              name='multiplier'
              label='Product Variant'
              control={control}
              errors={errors}
              disabled={true}
            />
          </Grid>
          {/* {getValues('stock_type') === 'non_medical' ? null : ( */}
          <Grid item size={{ xs: 12, sm: 3 }}>
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
          {/* )} */}
          {/* {getValues('stock_type') === 'non_medical' ? null : ( */}
          <Grid item size={{ xs: 12, sm: 12 }}>
            <Typography variant='subtitle1'> Quantity</Typography>
          </Grid>
          {/* )} */}

          <Grid item size={{ xs: 12, sm: 3 }}>
            <ControlledTextField
              name='request_item_qty'
              label='Quantity*'
              control={control}
              errors={errors}
              required={true}
              onKeyDown={checkTotalCount}
              onPaste={checkTotalCount}
              onInput={checkTotalCount}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 12 }}>
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
                component='div'
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
