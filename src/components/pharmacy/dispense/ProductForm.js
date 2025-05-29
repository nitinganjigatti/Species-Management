import {
  Autocomplete,
  Button,
  FormControl,
  FormGroup,
  FormHelperText,
  Grid,
  Paper,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { getBatchList, getProductList } from 'src/lib/api/pharmacy/dispenseProduct'
import { Box, color, Stack } from '@mui/system'
import Icon from 'src/@core/components/icon'
import ConfirmDialog from 'src/components/ConfirmationDialog'
import { usePharmacyContext } from 'src/context/PharmacyContext'

import { useContext } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import Spacing from 'src/@core/theme/spacing'
import { da } from 'date-fns/locale'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'
import RenderUtility from 'src/utility/render'

function ProductForm({
  closeDialog,
  productArray,
  setProductArray,
  productArrayUi,
  setProductArrayUi,
  editMode,
  setEditMode,
  dataForEditRow,
  setDataForEditRow,
  selectedIndex,
  addedProcuctQty,
  setAddedProductQty,
  setDispensesPayload
}) {
  const theme = useTheme()

  const [totalProductQty, setTotalProductQty] = useState(null)
  const [totalQty, setTotalQty] = useState(0)

  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [invalidBatches, setInvalidBatches] = useState([])
  const [dataForSubmit, setDataForSubmit] = useState(null)

  const [selectedBatches, setSelectedBatches] = useState([])
  const [editBatchQty, setEditBatchQty] = useState(0)

  const { selectedPharmacy } = usePharmacyContext()

  const authData = useContext(AuthContext)

  const handleBatchChange = (event, newValue, index) => {
    // Clone the existing array and update the batch for the current index
    const updatedBatches = [...selectedBatches]
    updatedBatches[index] = newValue
    setValue(`product_batches[${index}].multiplier`, updatedBatches[0]?.multiplier)
    setValue(`product_batches[${index}].variant_id`, updatedBatches[0]?.variant_id)

    setSelectedBatches(updatedBatches)
  }

  const defaultProductDetails = !editMode
    ? {
        stock_id: {
          label: '',
          value: ''
        },
        product_batches: [
          {
            batch_no: {
              label: '',
              value: ''
            },
            qty: '',
            variant_id: '',
            multiplier: '',
            expiry_date: ''
          }
        ]
      }
    : {
        stock_id: {
          label: '',
          value: ''
        },
        batch_no: {
          label: '',
          value: ''
        },
        qty: '',
        variant_id: '',
        multiplier: '',
        expiry_date: ''
      }

  const ProductValidationSchema = !editMode
    ? Yup.object().shape({
        stock_id: Yup.object({
          value: Yup.string().required('Product Name is required')
        }),
        product_batches: Yup.array().of(
          Yup.object().shape({
            batch_no: Yup.object({
              value: Yup.string()
                .transform(value => (value === '' ? null : value))
                .required('Batch number is required')
                .test('uniqueBatchNo', 'Batch number already exists for this product', function (value) {
                  const duplicate = productArray.some(
                    item => item.batch_no === value && item?.stock_id === watch('stock_id')?.value
                  )

                  return !duplicate
                })
                .test('unique-batch-no', 'Batch number is already selected', function (value) {
                  const { product_batches } = this.options.from[2].value
                  const allBatchNumbers = product_batches?.map(batch => batch.batch_no)
                  const selectedBatchCount = allBatchNumbers?.filter(batchNo => batchNo?.value === value).length

                  return (selectedBatchCount === undefined ? 0 : selectedBatchCount) === 1
                })
            }),
            qty: Yup.number()
              .test('batch-required', 'Batch number is required', function (value) {
                return this.parent.batch_no?.value // Ensure batch_no is selected
              })
              .test('max-quantity', `Quantity can not be more than total available quantity`, function (value) {
                const { product_batches } = this?.options?.from[1]?.value // Accessing form values
                clearErrors('product_batches')

                const isValid = product_batches?.every(item => {
                  const batchQty = parseFloat(item?.batch_no?.qty)
                  const inputQty = parseFloat(item?.qty)

                  if (isNaN(batchQty) || isNaN(inputQty)) return true

                  return inputQty <= batchQty
                })
                if (!isValid) {
                  return this.createError({ message: 'Quantity cannot be more than total available quantity' })
                }

                return isValid
              })
              .required('Quantity is required')
              .typeError('Quantity should be a number')
              .positive('Quantity must be a positive number')
              .moreThan(0, 'Quantity must be greater than zero')
          })
        )
      })
    : Yup.object().shape({
        stock_id: Yup.object({
          value: Yup.string().required('Product Name is required')
        }),
        batch_no: Yup.object({
          value: Yup.string()
            .test('uniqueBatchNo', 'Batch number already exists for this product', function (value) {
              const duplicate = productArray.some(
                (item, index) =>
                  index !== selectedIndex && item.batch_no === value && item.stock_id === watch('stock_id')?.value
              )

              return !duplicate
            })
            .required('batch No. is required')
        }),
        qty: Yup.number()
          .typeError('Quantity must be a number')
          .required('Quantity is required')

          // .min(1, 'Quantity should be greater than 0')
          // .test('check-max-quantity', `Quantity should not be greater than ${totalQty}`, function (value) {
          //   return value <= totalQty
          // })
          .test('check-max-quantity', `Quantity should not be greater than ${editBatchQty}`, function (value) {
            return value <= editBatchQty
          })
      })

  const form = useForm({
    defaultValues: defaultProductDetails,
    resolver: yupResolver(ProductValidationSchema),
    shouldUnregister: false,
    reValidateMode: 'onChange',
    mode: 'onChange'
  })
  const { watch, control, handleSubmit, formState, getValues, setValue, reset, setError, clearErrors } = form

  const { errors } = formState

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'product_batches'
  })

  const handleAddRemoveSalts = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return (
        <>
          {addSaltButton()}
          {removeSaltButton(index)}
        </>
      )
    } else if (index <= 0 && fields?.length - 1 <= 0) {
      return (
        <>
          {addSaltButton()}
          {clearSaltFields(index)}
        </>
      )
    } else if (index <= 0 && fields?.length > 0) {
      return <>{clearSaltFields(index)}</>
    } else {
      return <>{removeSaltButton(index)}</>
    }
  }

  // const addSaltButton = () => {
  //   return (
  //     <Button
  //       variant='outlined'
  //       onClick={() => {
  //         append({
  //           batch_no: '',
  //           qty: ''
  //         })
  //       }}
  //       sx={{ marginRight: '4px', borderRadius: 6 }}
  //     >
  //       Add Another
  //     </Button>
  //   )
  // }

  // const removeSaltButton = index => {
  //   return (
  //     <Box>
  //       <Icon
  //         onClick={() => {
  //           remove(index)
  //         }}
  //         icon='material-symbols-light:close'
  //       />
  //     </Box>
  //   )
  // }

  // const clearSaltFields = index => {
  //   return (
  //     <Box>
  //       <Icon
  //         onClick={() => {
  //           remove(index)
  //           insert(index, {})
  //         }}
  //         icon='material-symbols-light:close'
  //       />
  //     </Box>
  //   )
  // }

  const addSaltButton = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyItems: 'center',
          alignItems: 'center'
        }}
      >
        <Icon
          style={{
            backgroundColor: '#F2FFF8',
            color: '#37BD69',
            height: '42px',
            width: '42px',

            border: '1px solid #37BD69',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          onClick={() => {
            append({
              batch_no: '',
              qty: ''
            })
          }}
          icon='si:add-duotone'
        />
      </Box>
    )
  }

  const removeSaltButton = index => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyItems: 'center',

          alignItems: 'center'
        }}
      >
        <Icon
          style={{
            backgroundColor: '#FFD3D333',
            color: '#E93353',
            height: '42px',
            width: '42px',
            border: '1px solid #E93353',
            borderRadius: '8px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
          onClick={() => {
            remove(index)
          }}
          icon='material-symbols-light:close-small'
        />
      </Box>

      // <Button
      //   variant='outlined'
      //   color='error'
      //   startIcon={<Icon icon='material-symbols-light:close' />}
      //   onClick={() => {
      //     var tempDefaultSalts = defaultSalts
      //     tempDefaultSalts.splice(index, 1)
      //     setDefaultSalts(tempDefaultSalts)
      //     remove(index)
      //   }}
      // >
      //   {/* Remove */}
      // </Button>
    )
  }

  const clearSaltFields = index => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyItems: 'center',
          alignItems: 'center'
        }}
      >
        <Icon
          style={{
            backgroundColor: '#FFD3D333',
            color: '#E93353',
            height: '42px',
            width: '42px',

            border: '1px solid #E93353',
            borderRadius: '8px',
            cursor: 'pointer',
            marginLeft: '10px'
          }}
          onClick={() => {
            remove(index)
            insert(index, {})
          }}
          icon='material-symbols-light:close-small'
        />
      </Box>
    )
  }

  const closeConfirmationDialog = () => {
    setShowConfirmationDialog(false)
    setInvalidBatches([])
  }

  // const checkForSubmit = data => {
  //   let paradata = data
  //   let confirmToSubmit = false
  //   data?.product_batches.forEach(batch => {
  //     const totalQty = parseInt(batch.batch_no.qty, 10)
  //     const filledQty = parseInt(batch.qty, 10)

  //     // Check if filled quantity is greater than total available quantity
  //     if (filledQty > totalQty) {
  //       // Set the state to true
  //       confirmToSubmit = true
  //       setInvalidBatches(prevInvalidBatches => [
  //         ...prevInvalidBatches,
  //         { batch_no: batch.batch_no, filledQty, totalQty }
  //       ])
  //     }
  //   })
  //   if (confirmToSubmit) {
  //     setShowConfirmationDialog(true)
  //     setDataForSubmit(paradata)

  //     // setInvalidBatches([])
  //   } else {
  //     submitItems(paradata)
  //     setInvalidBatches([])
  //   }
  // }

  function submitItems(data) {
    const index = productArrayUi.findIndex(item => item.stock_id?.value === data?.stock_id?.value)

    // If index is found, insert the new items just after that index
    if (index !== -1) {
      setProductArrayUi(prevArray => [
        ...prevArray.slice(0, index + 1),
        ...data?.product_batches?.map(item => ({
          stock_id: data?.stock_id,
          batch_no: item?.batch_no,
          qty: item?.qty,
          variant_id: item?.variant_id,
          multiplier: item?.multiplier,
          unit_price: data?.stock_id?.unit_price
        })),
        ...prevArray.slice(index + 1)
      ])
      setProductArray(prevArray => [
        ...prevArray.slice(0, index + 1),
        ...data?.product_batches?.map(item => {
          return {
            stock_id: data?.stock_id?.value,
            batch_no: item?.batch_no?.value,
            qty: item?.qty,
            variant_id: item?.variant_id,
            multiplier: item?.multiplier,
            unit_price: data?.stock_id?.unit_price
          }
        }),
        ...prevArray.slice(index + 1)
      ])
    } else {
      // If no matching stock_id found, add the new items at the end
      setProductArrayUi(prevArray => [
        ...prevArray,
        ...data?.product_batches?.map(item => ({
          stock_id: data?.stock_id,
          batch_no: item?.batch_no,
          qty: item?.qty,
          variant_id: item?.variant_id,
          multiplier: item?.multiplier,
          unit_price: data?.stock_id?.unit_price
        }))
      ])
      setProductArray(prevArray => [
        ...prevArray,
        ...data?.product_batches?.map(item => {
          return {
            stock_id: data?.stock_id?.value,
            batch_no: item?.batch_no?.value,
            qty: item?.qty,
            variant_id: item?.variant_id,
            multiplier: item?.multiplier,
            unit_price: data?.stock_id?.unit_price
          }
        })
      ])
    }
    reset()
    closeDialog()
    setAddedProductQty(0)
    setTotalQty(0)
  }

  const EditItems = data => {
    // Create a copy of productsArray to modify
    const updatedProductArray = [...productArray]
    const updatedProductArrayUi = [...productArrayUi]

    // Update the data at the found index
    updatedProductArray[selectedIndex] = {
      stock_id: data.stock_id?.value,
      batch_no: data.batch_no?.value,
      qty: data.qty,
      variant_id: data?.variant_id,
      multiplier: data?.multiplier,
      unit_price: data?.stock_id?.unit_price
    }

    // Update the data at the found index
    updatedProductArrayUi[selectedIndex] = {
      stock_id: data.stock_id,
      batch_no: data.batch_no,
      qty: data.qty,
      variant_id: data?.variant_id,
      multiplier: data?.multiplier,
      unit_price: data?.stock_id?.unit_price
    }

    // Update the state
    setProductArray([...updatedProductArray])
    setProductArrayUi([...updatedProductArrayUi])
    setDispensesPayload([...updatedProductArray])

    // Close the dialog or reset the form
    reset()
    closeDialog()
  }

  useEffect(() => {
    if (!editMode) {
      try {
        getProductList({ params: { sort: 'asc', q: '', limit: 20, is_specific: 1 } }).then(res => {
          if (res?.data?.list_items?.length > 0) {
            setProducts(
              res?.data?.list_items?.map(item => ({
                label: item.name,
                value: item.id,
                stock_type: item.stock_type,
                unit_price: item.unit_price,
                status: item?.active === '0' ? 0 : 1,
                manufacture: item?.manufacturer_name,
                packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
                control_substance: item?.controlled_substance === '1' ? true : false,
                generic_name: item?.generic_name,
                image: item?.image
              }))
            )
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
  }, [])

  const searchProductData = useCallback(
    debounce(async searchText => {
      try {
        await getProductList({ params: { sort: 'asc', q: searchText, limit: 20, is_specific: 1 } }).then(res => {
          if (res?.data?.list_items?.length > 0) {
            setProducts(
              res?.data?.list_items?.map(item => ({
                label: item.name,
                value: item.id,
                stock_type: item.stock_type,
                unit_price: item.unit_price,
                status: item?.active === '0' ? 0 : 1,
                manufacture: item?.manufacturer_name,
                packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
                control_substance: item.controlled_substance === '1' ? true : false
              }))
            )
          }
        })
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

  const onError = errors => {
    console.log('Form errros', errors)
  }

  const callBatchesApi = (stock_id, stock_type) => {
    if (stock_id) {
      getBatchList({ ProductId: stock_id, store_type: selectedPharmacy?.type, stock_type }).then(res => {
        if (res?.data?.items?.length > 0) {
          setBatches(
            res?.data?.items?.map(item => ({
              label: item?.batch_no,
              value: item?.batch_no,
              qty: item?.qty,
              variant_id: item?.variant_id,
              multiplier: item?.multiplier,
              expiry_date: item?.expiry_date
            }))
          )

          // setTotalProductQty(res?.data?.total_quantity)
          if (!editMode) {
            const matchingRows = productArrayUi.filter(item => item.stock_id?.value === stock_id)

            // Calculate the sum of quantities in matching rows
            const sumOfQuantities = matchingRows.reduce((sum, row) => sum + row.qty, 0)
            setTotalQty(res?.data?.total_quantity - sumOfQuantities)
          } else {
            setEditBatchQty(getValues('batch_no.qty'))
            setTotalQty(res?.data?.total_quantity)

            // const matchingRows = productArrayUi.filter(item => item.stock_id?.value === stock_id)
            // const sumOfQuantities = matchingRows.reduce((sum, row) => sum + row.qty, 0)
            // setTotalQty(res?.data?.total_quantity - sumOfQuantities + productArrayUi[selectedIndex].qty)
          }
          clearErrors(`product_batches[${0}].batch_no`)
        } else {
          setBatches([])
          setError(`product_batches[${0}].batch_no`, {
            type: 'manual',
            message: 'No Batches Available with this Product '
          })
        }
      })
    }
  }

  useEffect(() => {
    if (editMode) {
      console.log('dataForEditRow', dataForEditRow)
      setValue('stock_id', dataForEditRow?.stock_id)
      setValue('batch_no', dataForEditRow?.batch_no)
      setValue('qty', dataForEditRow?.qty)
      setValue('variant_id', dataForEditRow?.variant_id)
      setValue('multiplier', dataForEditRow?.multiplier)
      setValue('expiry_date', dataForEditRow?.expiry_date)

      callBatchesApi(dataForEditRow.stock_id?.value, dataForEditRow?.stock_id?.stock_type)
      setTotalQty(getValues('batch_no.qty'))
    }
  }, [editMode])

  // console.log(products, 'products')
  // console.log(watch('product_batches'), 'product_batches')
  // console.log(dataForEditRow, 'dataForEditRow')

  const productBatches = watch('product_batches') || []
  const unitPrice = watch('stock_id')?.unit_price || 0
  const watchQty = watch('qty') || 0
  console.log(watchQty, 'watchQty')

  const totalQuantity = editMode ? watchQty : productBatches.reduce((sum, batch) => sum + Number(batch.qty), 0)

  return (
    <Box>
      <ConfirmDialog
        open={showConfirmationDialog}
        title={'Your quantity exceeds the batch limit'}
        closeDialog={() => {
          closeConfirmationDialog()
        }}
        action={() => {
          submitItems(dataForSubmit)
        }}
        content={
          <>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#e3e3e3' }}>
                  <TableCell sx={{ py: 1, borderRight: '1px solid #ccc' }}>Batch no</TableCell>
                  <TableCell sx={{ py: 1, borderRight: '1px solid #ccc' }}>Available qty</TableCell>
                  <TableCell sx={{ py: 1 }}>Dispense qty</TableCell>
                </TableRow>
              </TableHead>
              {invalidBatches?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell
                    sx={{
                      py: 1,
                      borderRight: '1px solid #ccc',
                      borderBottom: index === invalidBatches.length - 1 && 'none'
                    }}
                  >
                    {item?.batch_no?.value}
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1,
                      borderRight: '1px solid #ccc',
                      borderBottom: index === invalidBatches.length - 1 && 'none'
                    }}
                  >
                    {item?.totalQty}
                  </TableCell>
                  <TableCell sx={{ py: 1, borderBottom: index === invalidBatches.length - 1 && 'none' }}>
                    {item?.filledQty}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </>
        }
      />
      <form onSubmit={handleSubmit(editMode ? EditItems : submitItems, onError)}>
        <Grid container mb={5}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              {/* <Typography sx={{ my: 2 }}>
                {`${
                  errors?.stock_id || watch('stock_id')?.value === '' ? '' : 'Total Available Quantity: ' + totalQty
                } `}
              </Typography> */}
              <Controller
                name='stock_id'
                control={control}
                render={({ field }) => (
                  <>
                    <Autocomplete
                      forcePopupIcon={false}
                      inputProps={{ tabIndex: '6' }}
                      noOptionsText='Type to search'
                      id='autocomplete-controlled'
                      options={products}
                      value={field?.value}
                      onChange={(event, newValue) => {
                        console.log(newValue, 'newValue')

                        field.onChange(newValue)
                        callBatchesApi(newValue?.value, newValue?.stock_type)
                        setValue('batch_no', '')
                        setValue('qty', '')
                      }}
                      onKeyUp={e => {
                        searchProductData(e?.target?.value)
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='
                          Product Name*'
                          placeholder='Search & Select'
                          error={Boolean(errors?.stock_id)}
                          sx={{ backgroundColor: 'white', borderRadius: 1 }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li
                          {...props}
                          style={{ opacity: option.status ? 1 : 0.5, pointerEvents: option.status ? 'auto' : 'none' }}
                        >
                          <Box>
                            <Typography>{option.label}</Typography>
                            <Typography variant='body2'>{option.packageDetails}</Typography>
                            <Typography variant='body2'>{option.manufacture}</Typography>
                            {RenderUtility?.renderControlLabel(option.control_substance === true, 'CS')}
                            {RenderUtility?.renderPrescriptionLabel(option.prescription_required === true, 'PR')}
                          </Box>
                        </li>
                      )}
                    />
                    {errors?.stock_id && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        {errors?.stock_id?.message?.includes('cannot be null')
                          ? 'Product Name is required'
                          : errors?.stock_id?.message || 'Product Name is required'}
                      </FormHelperText>
                    )}
                    {/* {errors?.stock_id && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        {errors?.stock_id?.message || 'Product Name is required'}
                      </FormHelperText>
                    )} */}
                  </>
                )}
              />
            </FormControl>
            {watch('stock_id')?.unit_price && (
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
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px' }}
                    >
                      Package:
                    </Typography>
                    <Typography
                      color='primary.light'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                    >
                      {watch('stock_id')?.packageDetails}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px' }}
                    >
                      Manufactured by:
                    </Typography>
                    <Typography
                      color='primary.light'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                    >
                      {watch('stock_id')?.manufacture}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px' }}
                    >
                      Total Available Quantity:
                    </Typography>
                    <Typography
                      color='primary.light'
                      style={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}
                    >
                      {`${errors?.stock_id || watch('stock_id')?.value === '' ? '' : totalQty} `}
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
                      component='span'
                      sx={{
                        fontSize: '12px',
                        fontWeight: 400,
                        color: 'customColors.OnPrimary'
                      }}
                    >
                      Unit Price - {Utility.formatAmountToReadableDigit(watch('stock_id')?.unit_price) || 0}
                    </Typography>
                  </Box>

                  {/* <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                      color='customColors.neutralSecondary'
                      sx={{ fontWeight: 400, fontFamily: 'Inter', fontSize: '12px' }}
                    >
                      Unit Price:
                    </Typography>
                    <Typography sx={{ fontWeight: 400, fontSize: '12px', color: 'customColors.OnPrimaryContainer' }}>
                      {Utility.formatAmountToReadableDigit(watch('stock_id')?.unit_price) || 0}
                    </Typography>
                  </Box> */}
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
        {/* /////////////////////////////////////////////////// */}

        <Box sx={{ mb: 4 }}>
          <Typography sx={{ color: 'customColors.customTextColorGray2', fontSize: '14px', fontWeight: 400 }}>
            Dispense Quantity
          </Typography>

          {/* {totalQuantity > 0 && ( */}
          <Stack direction='row' spacing={3} sx={{ textAlign: 'center' }}>
            <Typography
              variant='body2'
              sx={{ color: 'customColors.neutralSecondary', fontSize: '14px', fontWeight: 400 }}
            >
              Total Dispense Quantity:{' '}
              <Typography component='span' variant='body2' sx={{ color: 'primary.light' }}>
                {/* {Utility.formatAmountToReadableDigit(watch('stock_id')?.unit_price)} */}
                {Utility.formatAmountToReadableDigit(unitPrice * totalQuantity) || 0}
              </Typography>
            </Typography>
          </Stack>
          {/* )} */}
        </Box>

        {!editMode ? (
          <FormGroup sx={{ bgcolor: '#0000000D', padding: 2, borderRadius: 1 }}>
            {fields.map((field, index) => (
              <Grid container spacing={3} key={field?.id} sx={{ mb: 2, mt: 2 }}>
                <Grid item xs={12} sm={3} md={3.5}>
                  <FormControl fullWidth>
                    <Controller
                      name={`product_batches[${index}].batch_no`}
                      control={control}
                      render={({ field }) => (
                        <>
                          <Autocomplete
                            forcePopupIcon={false}
                            inputProps={{ tabIndex: '6' }}
                            id={`product_batches[${index}].batch_no`}
                            options={batches}
                            getOptionLabel={option => option?.label || ''}
                            disabled={
                              batches?.length === 0
                                ? true
                                : false || watch('stock_id')?.value === '' || null || errors.stock_id?.message
                            }
                            isOptionEqualToValue={(option, value) =>
                              parseInt(option?.batch_no) === parseInt(value?.batch_no)
                            }
                            value={field?.value}
                            onChange={(event, newValue) => {
                              field.onChange(newValue)

                              handleBatchChange(event, newValue, index)
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Batch No.*'
                                placeholder='Search'
                                error={Boolean(errors?.product_batches?.[index]?.batch_no)}
                                sx={{ backgroundColor: 'white', borderRadius: 1 }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box
                                component='li'
                                {...props}
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
                                    color='customColors.customHeadingTextColor'
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {option.label}
                                  </Typography>
                                  <Typography variant='body2' color='customColors.neutralSecondary'>
                                    Expiry Date: {Utility.formatDisplayDate(option?.expiry_date)}
                                  </Typography>
                                  <Typography variant='body2' color='primary.main'>
                                    Availability: {option?.qty}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            PaperComponent={({ children, ...props }) => (
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
                            )}
                          />
                          {errors?.product_batches?.[index]?.batch_no && (
                            <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                              {errors?.product_batches?.[index]?.batch_no?.message?.includes('cannot be null') ||
                              errors?.product_batches?.[index]?.batch_no?.message?.includes('must be a `object` type')
                                ? 'Batch No. is required'
                                : errors?.product_batches?.[index]?.batch_no?.value?.message ||
                                  'Batch number already exists for this product' ||
                                  'Batch No. is required'}
                              {/* {errors?.product_batches?.[index]?.batch_no?.message ===
                              `product_batches[${index}].batch_no cannot be null`
                                ? 'Batch No. is required'
                                : errors?.product_batches?.[index]?.batch_no?.message ||
                                  'Batch number already exists for this product' ||
                                  'Batch No. is required'} */}
                            </FormHelperText>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3} md={3.5}>
                  <FormControl fullWidth>
                    <Controller
                      name={`product_batches[${index}].multiplier`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          disabled
                          type='text'
                          value={value || ''}
                          InputLabelProps={{ shrink: true }}
                          label='Product Variant'
                          error={Boolean(errors?.product_batches?.[index]?.multiplier)}
                          name={`product_batches[${index}].multiplier`}
                          onKeyUp={() => {
                            if (!errors?.product_batches?.[index]?.multiplier) {
                              errors?.product_batches?.forEach((batchError, index) => {
                                clearErrors('product_batches', index)
                              })
                            }
                          }}
                          sx={{ backgroundColor: 'white', borderRadius: 1 }}
                        />
                      )}
                    ></Controller>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3} md={3.5}>
                  <FormControl fullWidth>
                    <Controller
                      name={`product_batches[${index}].qty`}
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <TextField
                            type='number'
                            value={value}
                            label='Quantity*'
                            onChange={onChange}
                            error={Boolean(errors?.product_batches?.[index]?.qty)}
                            name={`product_batches[${index}].qty`}
                            onKeyUp={() => {
                              if (!errors?.product_batches?.[index]?.qty) {
                                errors?.product_batches?.forEach((batchError, index) => {
                                  clearErrors('product_batches', index)
                                })
                              }
                            }}
                            sx={{ backgroundColor: 'white', borderRadius: 1 }}
                          />
                        </>
                      )}
                    />
                  </FormControl>
                  <Typography sx={{ fontSize: 12, ml: 2 }}>
                    {` ${
                      getValues('product_batches')[index]?.batch_no?.value === '' ||
                      getValues('product_batches')[index]?.batch_no?.value === null ||
                      getValues('product_batches')[index]?.batch_no?.value < 0 ||
                      getValues('product_batches')[index]?.batch_no?.value === undefined ||
                      getValues('product_batches')[index]?.batch_no?.qty === undefined ||
                      errors?.product_batches?.[index]?.batch_no
                        ? ''
                        : selectedBatches[index] && 'Available Batch Quantity: ' + selectedBatches[index].qty
                    }`}
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={3}
                  md={1.5}
                  sx={{
                    display: 'flex',
                    justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                    alignItems: 'center'
                  }}
                >
                  {handleAddRemoveSalts(fields, index)}
                </Grid>
              </Grid>
            ))}
          </FormGroup>
        ) : (
          <Grid
            container
            mb={3}
            rowSpacing={4}
            columnSpacing={2}
            sx={{ bgcolor: '#0000000D', padding: 2, pl: 0, borderRadius: 1 }}
          >
            <Grid item xs={12} sm={4} md={4}>
              <FormControl fullWidth>
                <Controller
                  name='batch_no'
                  control={control}
                  render={({ field }) => (
                    <>
                      <Autocomplete
                        forcePopupIcon={false}
                        inputProps={{ tabIndex: '6' }}
                        disablePortal
                        disabled={batches?.length === 0 ? true : false}
                        value={field?.value}
                        options={batches}
                        getOptionLabel={option => option?.label || ''}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Batches*'
                            error={Boolean(errors.batch_no)}
                            sx={{ backgroundColor: 'white', borderRadius: 1 }}
                          />
                        )}
                        onChange={(event, newValue) => {
                          field.onChange(newValue)

                          // clearErrors('product_batches')
                          clearErrors('qty')
                          setEditBatchQty(newValue?.qty)
                          if (parseFloat(newValue?.qty) < parseFloat(getValues('qty'))) {
                            setError('qty', {
                              type: 'manual',
                              message: `Quantity should not be greater than ${newValue?.qty}`
                            })
                          }
                        }}
                        renderOption={(props, option) => (
                          <Box
                            component='li'
                            {...props}
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
                                color='customColors.customHeadingTextColor'
                                sx={{ fontWeight: 600 }}
                              >
                                {option.label}
                              </Typography>
                              <Typography variant='body2' color='customColors.neutralSecondary'>
                                Expiry Date: {Utility.formatDisplayDate(option?.expiry_date)}
                              </Typography>
                              <Typography variant='body2' color='primary.main'>
                                Availability: {option?.qty}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      />
                      {errors.batch_no && (
                        <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                          {errors.batch_no.message === 'batch_no cannot be null'
                            ? 'Batch No is required'
                            : errors.batch_no.message ||
                              'Batch number already exists for this product' ||
                              'Batch No. is required'}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <Controller
                  name='multiplier'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      disabled
                      type='text'
                      value={value}
                      label='Product Variant'
                      name='multiplier'
                      error={Boolean(errors.multiplier)}
                      onChange={onChange}
                      sx={{ backgroundColor: 'white', borderRadius: 1 }}
                    />
                  )}
                >
                  {errors.multiplier && (
                    <FormHelperText sx={{ color: 'error.main' }}>{errors?.multiplier?.message}</FormHelperText>
                  )}
                </Controller>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <FormControl fullWidth>
                <Controller
                  name='qty'
                  control={control}
                  render={({ field }) => (
                    <>
                      <TextField
                        type='number'
                        disabled={watch('batch_no') === '' || errors?.batch_no}
                        value={field.value}
                        error={Boolean(errors.qty)}
                        label='Quantity*'
                        onChange={e => {
                          field.onChange(e.target.value)
                        }}
                        sx={{ backgroundColor: 'white', borderRadius: 1 }}
                      />
                      {errors?.qty && (
                        <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                          {errors.qty?.message}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </FormControl>
              <Typography sx={{ fontSize: 12, ml: 2 }}>
                {` ${
                  getValues('batch_no')?.value === '' ||
                  getValues('batch_no')?.value === null ||
                  getValues('batch_no')?.value < 0 ||
                  getValues('batch_no')?.value === undefined ||
                  getValues('batch_no')?.qty === undefined ||
                  errors?.batch_no
                    ? ''
                    : 'Available Batch Quantity: ' + editBatchQty
                }`}
              </Typography>
            </Grid>
          </Grid>
        )}
        {errors?.product_batches?.some(batch => batch?.qty) && (
          <FormHelperText sx={{ color: 'error.main', fontSize: 16 }} id='validation-basic-first-name'>
            {errors.product_batches.find(batch => batch?.qty)?.qty?.message || 'Quantity should be greater than 0'}
          </FormHelperText>
        )}
        <Grid item xs={12} sm={12} sx={{ mt: '40px' }}>
          <Grid Grid sx={{ height: '100%' }} alignItems='flex-end' justifyContent='flex-end' container>
            {editMode ? (
              <Button type='submit' variant='contained'>
                Update
              </Button>
            ) : (
              <Button type='submit' variant='contained'>
                Add
              </Button>
            )}
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}

export default ProductForm
