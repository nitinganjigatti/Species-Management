import {
  Autocomplete,
  Button,
  CardContent,
  FormControl,
  FormHelperText,
  Grid,
  TextField,
  debounce
} from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { getBatchList, getProductList } from 'src/lib/api/pharmacy/dispenseProduct'

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
  const [totalProductQty, setTotalProductQty] = useState(0)

  const [products, setProducts] = useState([])
  const [batches_s, setBatches_s] = useState([])

  const defaultProductDetails = {
    stock_id: {
      label: '',
      value: ''
    },
    batch_no: {
      label: '',
      value: ''
    },
    product_quantity: ''
  }

  const ProductValidationSchema = Yup.object().shape({
    stock_id: Yup.object({
      value: Yup.string().required('Product Name is required')
    }),
    batch_no: Yup.object({
      value: !editMode
        ? Yup.string()
            .test('uniqueBatchNo', 'Batch number already exists for this product', function (value) {
              const duplicate = productArray.some(
                item => item.batch_no === value && item?.stock_id === watch('stock_id')?.value
              )

              return !duplicate
            })
            .required('batch No. is required')
        : Yup.string()
            .test('uniqueBatchNo', 'Batch number already exists for this product', function (value) {
              const duplicate = productArray.some(
                (item, index) =>
                  index !== selectedIndex && item.batch_no === value && item.stock_id === watch('stock_id')?.value
              )

              return !duplicate
            })
            .required('batch No. is required')
    }),
    product_quantity: !editMode
      ? Yup.number()
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
            const remainingQuantity = totalProductQty - sumOfQuantities

            // Check if the current value exceeds the remaining quantity
            setAddedProductQty(remainingQuantity)

            return value <= remainingQuantity
          })
      : Yup.number()
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
            const remainingQuantity = totalProductQty - sumOfQuantities + productArrayUi[selectedIndex].qty

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
  const { watch, control, handleSubmit, formState, setValue, reset, setError, clearErrors } = form

  const { errors } = formState

  // adding product details
  const submitItems = data => {
    setProductArrayUi([
      ...productArrayUi,
      {
        stock_id: data.stock_id,
        batch_no: data.batch_no,
        qty: data.product_quantity
      }
    ])
    setProductArray([
      ...productArray,
      {
        stock_id: data.stock_id?.value,
        batch_no: data.batch_no?.value,
        qty: data.product_quantity
      }
    ])
    setDispensesPayload([
      ...productArray,
      {
        stock_id: data.stock_id?.value,
        batch_no: data.batch_no?.value,
        qty: data.product_quantity
      }
    ])

    // Close the dialog or reset the form
    setTotalProductQty(0)
    reset(defaultProductDetails)
    closeDialog()
  }

  const EditItems = data => {
    const indexToReplace = productArray.findIndex(
      item => item.stock_id === dataForEditRow?.stock_id?.value && item.batch_no === dataForEditRow?.batch_no?.value
    )

    if (indexToReplace !== -1) {
      // Create a copy of productsArray to modify
      const updatedProductArray = [...productArray]
      const updatedProductArrayUi = [...productArrayUi]

      // Update the data at the found index
      updatedProductArray[indexToReplace] = {
        stock_id: data.stock_id?.value,
        batch_no: data.batch_no?.value,
        qty: data.product_quantity
      }

      // Update the data at the found index
      updatedProductArrayUi[indexToReplace] = {
        stock_id: data.stock_id,
        batch_no: data.batch_no,
        qty: data.product_quantity
      }

      setProductArray([...updatedProductArray])
      setProductArrayUi([...updatedProductArrayUi])
      setDispensesPayload([...updatedProductArray])

      // Close the dialog or reset the form
      reset(defaultProductDetails)
      closeDialog()
    } else {
      console.error('Data not found for replacement')
    }
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
          setBatches_s(
            res?.data?.items?.map(item => ({
              label: item?.batch_no,
              value: item?.batch_no,
              qty: item?.qty
            }))
          )
          clearErrors('batch_no')
          if (editMode) {
            setTotalProductQty(
              Number(res?.data?.items?.find(item => item?.batch_no === dataForEditRow?.batch_no?.value)?.qty)
            )
          }
        } else {
          setBatches_s([])
          setError('batch_no', {
            type: 'manual',
            message: 'No Batches Available with this Product '
          })
        }
      })
    }
  }

  useEffect(() => {
    if (editMode) {
      setValue('stock_id', dataForEditRow.stock_id)
      setValue('batch_no', dataForEditRow?.batch_no)
      setValue('product_quantity', dataForEditRow.qty)
      callBatchesApi(dataForEditRow.stock_id?.value)
    }
  }, [editMode])

  return (
    <CardContent>
      <form onSubmit={handleSubmit(editMode ? EditItems : submitItems)}>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6}>
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
                        searchProductData(e.target.value)
                      }}
                      renderInput={params => (
                        <TextField {...params} label='Product Name*' error={Boolean(errors.stock_id)} />
                      )}
                    />
                    {errors.stock_id && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        {errors.stock_id.message || 'Product Name is required'}
                      </FormHelperText>
                    )}
                  </>
                )}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={6}>
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
                      disabled={batches_s?.length === 0 ? true : false}
                      value={field?.value}
                      options={batches_s}
                      getOptionLabel={option => option?.label || ''}
                      renderInput={params => (
                        <TextField {...params} label='Batch No*' error={Boolean(errors.batch_no)} />
                      )}
                      onChange={(event, newValue) => {
                        field.onChange(newValue)
                        setTotalProductQty(newValue?.qty)
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

          <Grid item xs={12} sm={12} md={6}>
            <FormControl fullWidth>
              <Controller
                name='product_quantity'
                control={control}
                render={({ field }) => (
                  <>
                    <TextField
                      type='number'
                      disabled={watch('batch_no') === ''}
                      value={field.value}
                      error={Boolean(errors.product_quantity)}
                      label='Quantity*'
                      onChange={e => {
                        field.onChange(e.target.value)
                      }}
                    />
                    {errors.product_quantity && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        {errors.product_quantity.message || ' Quantity should be greater than 0'}
                      </FormHelperText>
                    )}
                  </>
                )}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={6}>
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
        </Grid>
      </form>
    </CardContent>
  )
}

export default ProductForm
