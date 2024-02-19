import {
  Autocomplete,
  Button,
  CardContent,
  FormControl,
  FormGroup,
  FormHelperText,
  Grid,
  TextField,
  debounce
} from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { getBatchList, getProductList } from 'src/lib/api/pharmacy/dispenseProduct'
import { Box } from '@mui/system'
// ** Icon Imports
import Icon from 'src/@core/components/icon'

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
  const [totalProductQty, setTotalProductQty] = useState(null)
  const [totalQty, setTotalQty] = useState(0)

  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [fulfilledQuantity, setFulfilledQuantity] = useState(0)

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
            qty: ''
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
        qty: ''
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
              .test('max-quantity', 'Quantity can not be more than available quantity', function (v) {
                return this.options?.from[0].value.batch_no?.qty >= v
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
          .min(1, 'Quantity should be greater than 0')
          .test('check-max-quantity', `Quantity should not be greater than ${addedProcuctQty}`, function (value) {
            const { batch_no } = this.parent // Accessing form values
            // Find all rows in productArray with matching batch_no
            const matchingRows = productArrayUi.filter(item => item.batch_no?.value === batch_no?.value)
            // Calculate the sum of quantities in matching rows
            const sumOfQuantities = matchingRows.reduce((sum, row) => sum + row.qty, 0)
            // // Calculate the remaining quantity
            const remainingQuantity = totalQty - sumOfQuantities + productArrayUi[selectedIndex].qty
            // Check if the current value exceeds the remaining quantity
            setAddedProductQty(remainingQuantity)
            return value <= remainingQuantity
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

  const addSaltButton = () => {
    return (
      <Button
        variant='outlined'
        onClick={() => {
          append({
            batch_no: '',
            qty: ''
          })
        }}
        sx={{ marginRight: '4px', borderRadius: 6 }}
      >
        Add Another
      </Button>
    )
  }

  const removeSaltButton = index => {
    return (
      <Box>
        <Icon
          onClick={() => {
            remove(index)
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const clearSaltFields = index => {
    return (
      <Box>
        <Icon
          onClick={() => {
            remove(index)
            insert(index, {})
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const getAllQuantityValues = () => {
    const allValues = getValues()

    const sum = allValues.product_batches?.reduce((accumulator, batch) => {
      return accumulator + (parseFloat(batch.qty) || 0)
    }, 0)

    setFulfilledQuantity(sum)
  }

  const submitItems = data => {
    const index = productArrayUi.findIndex(item => item.stock_id?.value === data?.stock_id?.value)

    // If index is found, insert the new items just after that index
    if (index !== -1) {
      setProductArrayUi(prevArray => [
        ...prevArray.slice(0, index + 1),
        ...data?.product_batches?.map(item => ({
          stock_id: data?.stock_id,
          batch_no: item?.batch_no,
          qty: item?.qty
        })),
        ...prevArray.slice(index + 1)
      ])
      setProductArray(prevArray => [
        ...prevArray.slice(0, index + 1),
        ...data?.product_batches?.map(item => {
          return {
            stock_id: data?.stock_id?.value,
            batch_no: item?.batch_no?.value,
            qty: item?.qty
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
          qty: item?.qty
        }))
      ])
      setProductArray(prevArray => [
        ...prevArray,
        ...data?.product_batches?.map(item => {
          return {
            stock_id: data?.stock_id?.value,
            batch_no: item?.batch_no?.value,
            qty: item?.qty
          }
        })
      ])
    }
    reset()
    closeDialog()
  }

  const EditItems = data => {
    // Create a copy of productsArray to modify
    const updatedProductArray = [...productArray]
    const updatedProductArrayUi = [...productArrayUi]
    // Update the data at the found index
    updatedProductArray[selectedIndex] = {
      stock_id: data.stock_id?.value,
      batch_no: data.batch_no?.value,
      qty: data.qty
    }
    // Update the data at the found index
    updatedProductArrayUi[selectedIndex] = {
      stock_id: data.stock_id,
      batch_no: data.batch_no,
      qty: data.qty
    }

    setProductArray([...updatedProductArray])
    setProductArrayUi([...updatedProductArrayUi])
    setDispensesPayload([...updatedProductArray])

    // Close the dialog or reset the form
    reset()
    setTotalProductQty(null)
    closeDialog()
  }

  const searchProductData = useCallback(
    debounce(async searchText => {
      try {
        await getProductList({ params: { sort: 'asc', q: searchText, limit: 20 } }).then(res => {
          if (res?.data?.list_items.length > 0) {
            setProducts(
              res?.data?.list_items?.map(item => ({
                label: item.name,
                value: item.id
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

  const callBatchesApi = stock_id => {
    if (stock_id) {
      getBatchList({ ProductId: stock_id }).then(res => {
        if (res?.data?.items?.length > 0) {
          setBatches(
            res?.data?.items?.map(item => ({
              label: item?.batch_no,
              value: item?.batch_no,
              qty: item?.qty
            }))
          )
          setTotalProductQty(res?.data?.total_quantity)
          clearErrors(`product_batches[${0}].batch_no`)
          if (editMode) {
            setTotalQty(Number(res?.data?.items?.find(item => item?.batch_no === dataForEditRow?.batch_no?.value)?.qty))
          }
        } else {
          // setTotalQty(0)
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
      setValue('stock_id', dataForEditRow?.stock_id)
      setValue('batch_no', dataForEditRow?.batch_no)
      setValue('qty', dataForEditRow?.qty)
      callBatchesApi(dataForEditRow.stock_id?.value)
    }
  }, [editMode])

  return (
    <CardContent>
      <form onSubmit={handleSubmit(editMode ? EditItems : submitItems)}>
        <Grid container mb={5}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <Controller
                name='stock_id'
                control={control}
                render={({ field }) => (
                  <>
                    <Autocomplete
                      forcePopupIcon={false}
                      inputProps={{ tabIndex: '6' }}
                      disablePortal
                      id='autocomplete-controlled'
                      options={products}
                      value={field?.value}
                      onChange={(event, newValue) => {
                        field.onChange(newValue)
                        callBatchesApi(newValue?.value)
                      }}
                      onKeyUp={e => {
                        searchProductData(e?.target?.value)
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={`
                          ${
                            errors?.stock_id || watch('stock_id')?.value === ''
                              ? 'Product Name*'
                              : 'Total Available Quantity* ' + totalProductQty
                          }
                       `}
                          error={Boolean(errors?.stock_id)}
                        />
                      )}
                    />
                    {errors?.stock_id && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        {errors?.stock_id?.message || 'Product Name is required'}
                      </FormHelperText>
                    )}
                  </>
                )}
              />
            </FormControl>
          </Grid>
        </Grid>
        {!editMode ? (
          <FormGroup>
            {fields.map((field, index) => (
              <Grid container gap={3} key={field?.id} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={5.7}>
                  <FormControl fullWidth>
                    <Controller
                      name={`product_batches[${index}].batch_no`}
                      control={control}
                      render={({ field }) => (
                        <>
                          <Autocomplete
                            forcePopupIcon={false}
                            inputProps={{ tabIndex: '6' }}
                            disablePortal
                            id={`product_batches[${index}].batch_no`}
                            options={batches}
                            getOptionLabel={option => option?.label || ''}
                            getOptionDisabled={option => option?.qty < 1}
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
                              console.log('newValue', newValue)
                              setTotalQty(newValue?.qty)
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label='Batch*'
                                placeholder='Search'
                                error={Boolean(errors?.product_batches?.[index]?.batch_no)}
                              />
                            )}
                          />
                          {errors?.product_batches?.[index]?.batch_no && (
                            <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                              {errors?.product_batches?.[index]?.batch_no?.message === 'batch_no cannot be null'
                                ? 'Batch No is required'
                                : errors?.product_batches?.[index]?.batch_no?.message ||
                                  'Batch number already exists for this product' ||
                                  'Batch No. is required'}
                            </FormHelperText>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={5.5}>
                  <FormControl fullWidth>
                    <Controller
                      name={`product_batches[${index}].qty`}
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <>
                          <TextField
                            type='number'
                            value={value}
                            label={` ${
                              watch('product_batches')[index]?.batch_no?.value === '' ||
                              watch('product_batches')[index]?.batch_no?.value === null ||
                              watch('product_batches')[index]?.batch_no?.value < 0 ||
                              watch('product_batches')[index]?.batch_no?.value === undefined ||
                              watch('product_batches')[index]?.batch_no?.qty === undefined ||
                              errors?.product_batches?.[index]?.batch_no
                                ? 'Quantity*'
                                : 'Available Btach Quantity*' + watch('product_batches')[index]?.batch_no?.qty
                            }`}
                            onChange={onChange}
                            disabled={
                              watch('product_batches')[index]?.batch_no?.value === '' ||
                              null ||
                              errors?.product_batches?.[index]?.batch_no
                            }
                            error={Boolean(errors?.product_batches?.[index]?.qty)}
                            name={`product_batches[${index}].qty`}
                            onKeyUp={() => {
                              getAllQuantityValues()
                            }}
                          />
                          {errors?.product_batches?.[index]?.qty && (
                            <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                              {errors?.product_batches?.[index]?.qty?.message || ' Quantity should be greater than 0'}
                            </FormHelperText>
                          )}
                        </>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid
                  item
                  alignSelf='center'
                  sx={{
                    display: 'flex',
                    justifyItems: 'center',
                    alignItems: 'center'
                  }}
                >
                  {handleAddRemoveSalts(fields, index)}
                </Grid>
              </Grid>
            ))}
          </FormGroup>
        ) : (
          <Grid container mb={3} justifyContent={'space-between'}>
            <Grid item xs={12} sm={12} md={5.9}>
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
                        getOptionDisabled={option => option?.qty < 1}
                        disabled={batches?.length === 0 ? true : false}
                        value={field?.value}
                        options={batches}
                        getOptionLabel={option => option?.label || ''}
                        renderInput={params => (
                          <TextField {...params} label='Batches*' error={Boolean(errors.batch_no)} />
                        )}
                        onChange={(event, newValue) => {
                          field.onChange(newValue)
                          setTotalQty(newValue?.qty)
                        }}
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

            <Grid item xs={12} sm={12} md={5.8}>
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
                      />
                      {errors.qty && (
                        <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                          {errors.qty.message || ' Quantity should be greater than 0'}
                        </FormHelperText>
                      )}
                    </>
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>
        )}

        <Grid item xs={12} sm={12}>
          <Grid Grid sx={{ height: '100%' }} alignItems='flex-end' justifyContent='flex-end' container>
            {editMode ? (
              <Button type='submit' variant='contained'>
                Edit
              </Button>
            ) : (
              <Button type='submit' variant='contained'>
                Add
              </Button>
            )}
          </Grid>
        </Grid>
      </form>
    </CardContent>
  )
}

export default ProductForm
