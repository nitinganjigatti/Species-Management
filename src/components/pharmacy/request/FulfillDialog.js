// ** React Imports
import { useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import { styled, createTheme } from '@mui/material/styles'
import FormGroup from '@mui/material/FormGroup'
import Autocomplete from '@mui/material/Autocomplete'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { FormControl, FormHelperText } from '@mui/material'

// ** MUI Imports

import Grid from '@mui/material/Grid'

import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

import { CardContent, Card } from '@mui/material'
import Typography from '@mui/material/Typography'
import { Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'

import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'

import TableCell from '@mui/material/TableCell'
import UserSnackbar from 'src/components/utility/snackbar'
import DialogActions from '@mui/material/DialogActions'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'

import TableHead from '@mui/material/TableHead'
import ConfirmDialog from 'src/components/ConfirmationDialog'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

import { getAvailableMedicineByMedicineId } from 'src/lib/api/pharmacy/getRequestItemsList'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { addDispatch } from 'src/lib/api/pharmacy/getRequestItemsList'
import Utility from 'src/utility'
import { AddButton } from 'src/components/Buttons'
import { useRouter } from 'next/router'

const FulfillDialog = ({ title, dialogBoxStatus, close, fulfillMedicine, storeDetails }) => {
  const defaultValues = {
    product_batches: [
      {
        batch_no: '',
        expiry_date: '',
        qty: 0,
        quantityAvailable: 0
      }
    ]
  }

  const schema = yup.object().shape({
    product_batches: yup.array().of(
      yup.object().shape({
        batch_no: yup.string().test('unique-batch-no', 'Batch number is already selected', function (value) {
          const { product_batches } = this.options.from[1].value

          const allBatchNumbers = product_batches?.map(batch => batch.batch_no)

          const selectedBatchCount = allBatchNumbers?.filter(batchNo => batchNo === value).length

          return (selectedBatchCount === undefined ? 0 : selectedBatchCount) === 1
        }),
        expiry_date: yup.string().required('Expiry Date is required'),
        qty: yup
          .number()
          .required('Quantity is required')
          .typeError('Quantity should be a number')
          .positive('Quantity must be a positive number')
          .moreThan(0, 'Quantity must be greater than zero')
      })
    )
  })

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    getValues,
    watch,

    setError
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [loader, setLoader] = useState(true)
  const [batchItems, setBatchItems] = useState([])
  const [totalProductCount, setTotalProductCount] = useState(0)
  const [localBatchItems, setLocalBatchItems] = useState([])
  const [fulfilStockItems, setFulfilStockItems] = useState([])
  const [fulfilledQuantity, setFulfilledQuantity] = useState(0)
  const [totalMedicine, setTotalMedicine] = useState(0)
  const [error, setErrors] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [invalidQty, setInvalidQty] = useState([])
  const [invalidQtyDialog, setInvalidQtyDialog] = useState(false)
  const [dispatchItems, setDispatchItems] = useState([])

  // const [invalidQty, setInvalidQty] = useState([])
  // const [invalidQtyDialog, setInvalidQtyDialog] = useState(false)
  // const [dispatchItems, setDispatchItems] = useState([])
  const [quantityError, setQuantityError] = useState(false)

  // const [errors, setErrors] = useState({})
  const [isLocalTableVisible, setIsLocalTableVisible] = useState(false)
  const [rowErrors, setRowErrors] = useState({})

  // const showConfirmationDialog = () => {
  //   setInvalidQtyDialog(true)
  // }

  // const closeConfirmationDialog = () => {
  //   setInvalidQtyDialog(false)
  //   setDispatchItems([])
  //   setInvalidQty([])
  // }
  const router = useRouter()

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const checkForPositiveInteger = number => {
    const regex = /^\d+$/
    const test = regex.test(number)

    return test
  }

  // const handleQuantityChange = (enteredQuantity, row, index) => {
  //   if (checkForPositiveInteger(enteredQuantity) && checkNumber(enteredQuantity) <= checkNumber(row.qty)) {
  //     // No error, the entered quantity is valid
  //     const tempState = rowErrors
  //     tempState[index] = false
  //     setRowErrors(tempState)
  //   } else if (enteredQuantity === '') {
  //     const tempState = rowErrors
  //     tempState[index] = false
  //     setRowErrors(tempState)
  //   } else {
  //
  //     const tempState = rowErrors
  //     tempState[index] = true
  //     setRowErrors(tempState)
  //   }

  //   console.log('rowErrors', rowErrors)
  //   onQuantityChange(row, enteredQuantity)
  // }

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'product_batches'
  })

  const handleQuantityChange = (enteredQuantity, row, text_id) => {
    const tempRowErrors = { ...rowErrors }
    if (checkForPositiveInteger(enteredQuantity) && checkNumber(enteredQuantity) <= checkNumber(row.qty)) {
      tempRowErrors[text_id] = { status: false }
    } else if (enteredQuantity === '') {
      tempRowErrors[text_id] = { status: false }
    } else {
      tempRowErrors[text_id] = { status: true }
    }

    setRowErrors(tempRowErrors)

    onQuantityChange(row, enteredQuantity)
  }

  const onQuantityChange = (row, qty) => {
    if (fulfilStockItems.length > 0) {
      const tempFulfilStockItems = fulfilStockItems.slice()
      let itemExists = false

      tempFulfilStockItems.forEach(item => {
        if (item.request_item_batch_no === row.batch_no) {
          itemExists = true
          item['request_item_dispatch_qty'] = qty
        }
      })

      if (!itemExists) {
        if (!isNaN(parseInt(qty)) && parseInt(qty) > 0) {
          const medicineRow = {
            from_store_type: row.type,
            from_store_id: row.store_id,
            to_store_type: storeDetails.to_store_type,
            to_store_id: storeDetails.to_store_id,

            dispatch_date: Utility.formatDate(Date()),

            request_item_dispatch_qty: qty,
            request_item_stock_item_id: row.stock_item_id,
            request_item_batch_no: row.batch_no,
            request_item_expiry_date: row.expiry_date,
            description: ''
          }

          tempFulfilStockItems.push(medicineRow)

          // setFulfilStockItems(localStockItems)
          // setTotalMedicine(getMedicineTotal(localStockItems))
        }
      } else {
        if (isNaN(parseInt(qty)) || parseInt(qty) <= 0) {
          const index = tempFulfilStockItems.findIndex(item => {
            return item.request_item_batch_no === row.batch_no
          })
          if (index !== -1) {
            tempFulfilStockItems.splice(index, 1)
          }
        }
      }

      setFulfilStockItems(tempFulfilStockItems)
      setTotalMedicine(getMedicineTotal(tempFulfilStockItems))
    } else {
      if (!isNaN(parseInt(qty)) && parseInt(qty) > 0) {
        const medicineRow = {
          from_store_type: row.type,
          from_store_id: row.store_id,
          to_store_type: storeDetails.to_store_type,
          to_store_id: storeDetails.to_store_id,

          dispatch_date: Utility.formatDate(Date()),

          request_item_dispatch_qty: qty,
          request_item_stock_item_id: row.stock_item_id,
          request_item_batch_no: row.batch_no,
          request_item_expiry_date: row.expiry_date,
          description: ''
        }
        setFulfilStockItems([medicineRow])
        setTotalMedicine(getMedicineTotal([medicineRow]))
      }
    }
  }

  const getMedicineTotal = data => {
    let total = 0
    if (data.length > 0) {
      data?.map(item => {
        if (
          !isNaN(item.request_item_dispatch_qty) &&
          item.request_item_dispatch_qty !== '' &&
          item.request_item_dispatch_qty !== ''
        ) {
          total = total + parseInt(item.request_item_dispatch_qty)
        }
      })
    }

    console.log(total)

    return total
  }

  const getMedicineByMedicineId = async (id, productType) => {
    setLoader(true)
    const data = { stock_item_id: id }
    const response = await getAvailableMedicineByMedicineId(id, data, 'central', productType)

    if (response.success) {
      const data = response?.data?.items

      const updatedItems = data.map(el => ({
        ...el,
        ['stock_type']: fulfillMedicine?.stock_type
      }))

      // setBatchItems(response?.data?.items)
      setBatchItems(updatedItems)
      setTotalProductCount(response?.data?.total_quantity)

      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  // const getMedicineByMedicineIdLocalStore = async id => {
  //   setLoader(true)
  //   const data = { stock_item_id: id }
  //   const response = await getAvailableMedicineByMedicineId(id, data, 'local')

  //   if (response.success) {
  //     setLocalBatchItems(response.data)
  //     console.log(response.data)
  //     setLoader(false)
  //   } else {
  //     setLoader(false)
  //   }
  // }

  const dispatchRequest = async data => {
    const payload = {
      dispatch_date: Utility.formatDate(Date()),
      dispatch_items: fulfilStockItems,
      request_number: storeDetails.id
    }

    try {
      setErrors(false)
      setSubmitLoader(true)

      const response = await addDispatch(payload)
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'success' })
        setSubmitLoader(false)
        close()
      } else {
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message?.name, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  useEffect(() => {
    if (fulfillMedicine?.stock_item_id !== undefined && fulfillMedicine?.stock_item_id !== null) {
      getMedicineByMedicineId(fulfillMedicine?.stock_item_id, fulfillMedicine?.stock_type)
    }
  }, [fulfillMedicine, storeDetails])

  const checkNumber = number => {
    return !isNaN(number) ? parseInt(number) : 0
  }

  const toggleLocalTable = () => {
    setIsLocalTableVisible(!isLocalTableVisible)
  }
  const theme = createTheme()

  const StyledText = styled('span')({
    textDecoration: 'none',
    color: theme.palette.primary.main,
    cursor: 'pointer'
  })

  const StyledErrorText = styled('span')({
    textDecoration: 'none',
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
    cursor: 'pointer',
    display: 'inline-block'
  })

  const handleAddRemoveSalts = (fields, index) => {
    if (fields.length - 1 === index && index > 0) {
      return (
        <>
          {addSaltButton()}
          {removeSaltButton(index)}
        </>
      )
    } else if (index <= 0 && fields.length - 1 <= 0) {
      return (
        <>
          {addSaltButton()}
          {clearSaltFields(index)}
        </>
      )
    } else if (index <= 0 && fields.length > 0) {
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
          //setSalts([])
          append({
            batch_no: '',
            expiry_date: '',
            qty: 0
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
            // var tempDefaultSalts = defaultSalts
            // tempDefaultSalts.splice(index, 1)
            // setDefaultSalts(tempDefaultSalts)
            remove(index)
          }}
          icon='material-symbols-light:close'
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
      // eslint-disable-next-line lines-around-comment
      // <Button
      //   variant='outlined'
      //   onClick={() => {
      //     var tempDefaultSalts = defaultSalts
      //     tempDefaultSalts[index] = undefined
      //     setDefaultSalts(tempDefaultSalts)
      //     remove(index)
      //     insert(index, {})
      //   }}
      // >
      //   Clear
      // </Button>

      <Box>
        <Icon
          onClick={() => {
            // var tempDefaultSalts = defaultSalts
            // tempDefaultSalts[index] = undefined
            // setDefaultSalts(tempDefaultSalts)

            if (fields?.length > 1) {
              remove(index)
            } else {
              remove(index)
              insert(index, {})
            }
          }}
          icon='material-symbols-light:close'
        />
      </Box>
    )
  }

  const getAllQuantityValues = () => {
    const allValues = getValues()

    const sum = allValues.product_batches.reduce((accumulator, batch) => {
      return accumulator + (parseFloat(batch.qty) || 0)
    }, 0)

    setFulfilledQuantity(sum)
  }

  const getTotalMedicineQuantity = params => {
    const sum = params.product_batches.reduce((accumulator, batch) => {
      return accumulator + (parseFloat(batch.qty) || 0)
    }, 0)

    return sum
  }

  const onSubmit = async params => {
    // setDispatchItems(params)
    var invalidQtyItems = []

    if (params?.product_batches?.length > 0) {
      invalidQtyItems = params?.product_batches?.filter(item => item.qty > item.quantityAvailable)
    }
    if (invalidQtyItems?.length > 0) {
      // setInvalidQty(invalidQtyItems)
      // setInvalidQtyDialog(true)
      setQuantityError(true)
    } else {
      dispatchingItems(params)
    }
  }

  const dispatchingItems = async params => {
    if (params?.product_batches?.length > 0) {
      const totalQuantity = getTotalMedicineQuantity(params)

      if (
        checkNumber(fulfillMedicine?.requested_qty) - checkNumber(fulfillMedicine?.dispatch_qty) - totalQuantity < 0 &&
        checkNumber(fulfilledQuantity) <= totalProductCount
      ) {
        return
      }

      const payload_list = []

      params.product_batches.forEach(item => {
        const payload_item = {}
        payload_item['dispatch_date'] = Utility.formatDate(Date())
        payload_item['request_item_dispatch_qty'] = item.qty
        payload_item['request_item_stock_item_id'] = fulfillMedicine?.stock_item_id
        payload_item['request_item_batch_no'] = item.batch_no
        payload_item['request_item_expiry_date'] = item.expiry_date
        payload_item['from_store_id'] = storeDetails?.from_store_id
        payload_item['from_store_type'] = storeDetails.from_store_type
        payload_item['to_store_id'] = storeDetails?.to_store_id
        payload_item['to_store_type'] = storeDetails.to_store_type

        payload_list.push(payload_item)
      })

      const payload = {
        dispatch_date: Utility.formatDate(Date()),
        dispatch_items: payload_list,
        request_number: storeDetails.id
      }

      try {
        setErrors(false)
        setSubmitLoader(true)

        const response = await addDispatch(payload)
        if (response?.success) {
          setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'success' })
          setSubmitLoader(false)
          close()
        } else {
          setSubmitLoader(false)
          setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message?.name, severity: 'error' })
        }
      } catch (e) {
        console.log(e)
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
      }
    }
  }

  // const handleConfirmDispatch = async () => {
  //   if (dispatchItems?.product_batches?.length > 0) {
  //     await dispatchingItems(dispatchItems)
  //     closeConfirmationDialog()
  //   }
  // }

  return (
    <>
      {loader ? (
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </CardContent>
      ) : (
        <Box sx={{ padding: '24px' }}>
          <Card
            sx={{
              backgroundColor: 'customColors.lightBg'
            }}
          >
            <CardContent>
              <Grid container sx={{ flexGrow: 1, m: 'auto' }}>
                <Grid item xs={12 / 5}>
                  <Typography sx={{ color: 'text.primary', marginTop: '0px' }}>Requested From</Typography>

                  <Typography sx={{ color: 'primary.light', marginTop: '0px' }}>
                    <strong>{storeDetails?.to_store}</strong>
                  </Typography>
                </Grid>
                <Grid item xs={12 / 5}>
                  <Typography sx={{ color: 'text.primary', marginTop: '0px' }}>Product Name</Typography>

                  <Typography sx={{ color: 'primary.light', marginTop: '0px' }}>
                    <strong>{fulfillMedicine?.stock_name}</strong>{' '}
                  </Typography>
                </Grid>
                <Grid item xs={12 / 5}>
                  <Typography sx={{ color: 'text.primary', marginTop: '0px', textAlign: 'right' }}>
                    QTY Requested
                  </Typography>
                  <Typography sx={{ color: 'primary.light', float: 'right' }}>
                    <strong>{fulfillMedicine?.requested_qty}</strong>{' '}
                  </Typography>
                </Grid>
                <Grid item xs={12 / 5}>
                  <Typography sx={{ color: 'text.primary', marginTop: '0px', textAlign: 'right' }}>Balance</Typography>
                  <Typography sx={{ color: 'primary.light', float: 'right' }}>
                    <strong>
                      {checkNumber(fulfillMedicine?.requested_qty) - checkNumber(fulfillMedicine?.dispatch_qty)}
                    </strong>
                  </Typography>
                </Grid>
                <Grid item xs={12 / 5}>
                  <Typography sx={{ color: 'text.primary', marginTop: '0px', textAlign: 'right' }}>
                    Total Qty Available
                  </Typography>
                  <Typography sx={{ color: 'primary.light', float: 'right' }}>
                    <strong>{totalProductCount}</strong>
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <form onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
            <Grid sx={{ my: '24px' }}>
              <Grid item xs={12} sm={12}>
                <FormGroup>
                  {fields.map((field, index) => (
                    <Grid
                      container
                      key={field.id}
                      sx={{
                        marginTop: '0px',

                        // my: 2,
                        py: '12px',
                        backgroundColor: 'customColors.neutral05',
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Grid item xs={2.7}>
                        <FormControl fullWidth>
                          <Controller
                            name={`product_batches[${index}].batch_no`}
                            control={control}
                            rules={{ required: true }}
                            value={`product_batches[${index}].batch_no`}
                            render={({ field: { value, onChange } }) => {
                              return (
                                <Autocomplete
                                  id={parseInt(`product_batches[${index}].batch_no`)}
                                  options={batchItems}
                                  getOptionLabel={option => option?.batch_no}
                                  isOptionEqualToValue={(option, value) =>
                                    parseInt(option?.batch_no) === parseInt(value?.batch_no)
                                  }
                                  onChange={(e, val) => {
                                    // if (val === null) {
                                    //   setValue(`product_batches[${index}].expiry_date`, '')

                                    //   return onChange('')
                                    // } else {
                                    //
                                    //   const expiryDate = val.expiry_date
                                    //   const quantity = parseInt(val?.qty)
                                    //   setValue(`product_batches[${index}].expiry_date`, expiryDate)
                                    //   setValue(`product_batches[${index}].quantityAvailable`, quantity)

                                    //   return onChange(val.batch_no)
                                    // }
                                    if (val === null) {
                                      setValue(`product_batches[${index}].expiry_date`, '')
                                      setValue(`product_batches[${index}].quantityAvailable`, '')
                                      onChange('')
                                    } else {
                                      const { expiry_date, qty } = val
                                      setValue(`product_batches[${index}].expiry_date`, expiry_date)
                                      setValue(`product_batches[${index}].quantityAvailable`, parseInt(qty))
                                      onChange(val.batch_no)
                                    }
                                  }}
                                  renderInput={params => {
                                    return (
                                      <TextField
                                        {...params}
                                        label='Batch No'
                                        placeholder='Search'
                                        sx={{ backgroundColor: 'white', borderRadius: 1 }}
                                        error={Boolean(errors?.product_batches?.[index]?.batch_no)}
                                      />
                                    )
                                  }}
                                />
                              )
                            }}
                          />

                          {errors?.product_batches?.[index]?.batch_no && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.product_batches?.[index]?.batch_no?.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      {batchItems[index]?.stock_type === 'non_medical' ? null : (
                        <Grid item xs={2.7}>
                          <FormControl fullWidth>
                            <Controller
                              name={`product_batches[${index}].expiry_date`}
                              control={control}
                              rules={{ required: false }}
                              render={({ field: { value, onChange } }) => (
                                <TextField
                                  disabled
                                  value={value}
                                  label='Expiry Date'
                                  onChange={onChange}
                                  placeholder='Expiry Date'
                                  sx={{ backgroundColor: 'white', borderRadius: 1 }}
                                  error={Boolean(errors?.product_batches?.[index]?.expiry_date)}
                                  name={`product_batches[${index}].expiry_date`}
                                />
                              )}
                            />
                            {errors?.product_batches?.[index]?.expiry_date && (
                              <FormHelperText sx={{ color: 'error.main' }}>
                                {errors?.product_batches?.[index]?.expiry_date?.message}
                              </FormHelperText>
                            )}
                          </FormControl>
                        </Grid>
                      )}
                      <Grid item xs={2.7}>
                        <FormControl fullWidth>
                          <Controller
                            name={`product_batches[${index}].qty`}
                            control={control}
                            rules={{
                              required: true,
                              validate: {
                                positiveNumber: value => ParseInt(value) > 0 || 'Please enter a number greater than 0'
                              }
                            }}
                            render={({ field: { value, onChange } }) => (
                              <TextField
                                type='text'
                                value={value}
                                label='Quantity'
                                onChange={e => {
                                  onChange(e)
                                  setQuantityError(false)
                                }}
                                sx={{ backgroundColor: 'white', borderRadius: 1 }}
                                placeholder='Quantity'
                                error={Boolean(errors?.product_batches?.[index]?.qty)}
                                name={`product_batches[${index}].qty`}
                                onKeyUp={() => {
                                  getAllQuantityValues()
                                }}
                              />
                            )}
                          />
                          {errors?.product_batches?.[index]?.qty && (
                            <FormHelperText sx={{ color: 'error.main' }}>
                              {errors?.product_batches?.[index]?.qty?.message}
                            </FormHelperText>
                          )}
                          {}

                          {watch(`product_batches[${index}].quantityAvailable`) > 0 ? (
                            <FormHelperText sx={{ color: 'primary.main' }}>
                              Available Quantity:{watch(`product_batches[${index}].quantityAvailable`)}
                            </FormHelperText>
                          ) : null}
                        </FormControl>
                      </Grid>

                      <Grid
                        item
                        xs={2.7}
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
              </Grid>
            </Grid>
            {/* {fulfilledQuantity > 0 ? (
                <>
                  <Grid container>
                    <Grid xs={12} style={{ textAlign: 'left', fontWeight: 'bold', marginTop: '10px' }}>
                      <Typography variant='body2' style={{ fontWeight: 'bold' }} sx={{ color: 'text.primary' }}>
                        <span style={{ fontWeight: 'normal' }}>Remaining Quantity - </span>
                        {checkNumber(fulfillMedicine?.requested_qty) -
                          checkNumber(fulfillMedicine?.dispatch_qty) -
                          fulfilledQuantity}
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              ) : null} */}

            <>
              {fulfilledQuantity >
              checkNumber(fulfillMedicine?.requested_qty) - checkNumber(fulfillMedicine?.dispatch_qty) ? (
                <div style={{ color: `${theme.palette.warning}`, marginTop: '10px' }}>
                  <StyledErrorText>The selected quantity is greater than the quantity requested</StyledErrorText>
                </div>
              ) : null}

              {totalProductCount < checkNumber(fulfilledQuantity) ? (
                <div style={{ color: `${theme.palette.warning}`, marginTop: '10px' }}>
                  <StyledErrorText>Total quantity should be lesser than Available Quantity</StyledErrorText>
                </div>
              ) : null}
              {quantityError && (
                <Grid item xs={12}>
                  <Typography color={'error.main'}>Quantity should be lesser than available Quantity.</Typography>
                </Grid>
              )}
              {batchItems.length === 0 ? (
                <Grid item xs={12} sx={{ my: 2 }}>
                  <Typography color={'error.main'}>This product is out of stock</Typography>
                </Grid>
              ) : null}
              <Grid item xs={12} style={{ alignSelf: 'flex-end', marginTop: '10px' }}>
                {batchItems.length === 0 ? (
                  <AddButton
                    styles={{ marginRight: 4 }}
                    action={() => {
                      router.push({
                        pathname: '/pharmacy/purchase/add-purchase/'
                      })
                    }}
                    title='Add Item'
                  />
                ) : (
                  <Box sx={{ float: 'right', my: 2 }}>
                    <LoadingButton
                      size='large'
                      variant='outlined'
                      sx={{ mx: 2 }}
                      onClick={() => {
                        close()
                      }}

                      // onClick={() => {
                      //   const count = Object.values(rowErrors).filter(item => item.status).length
                      //   if (
                      //     count <= 0 &&
                      //     totalMedicine <=
                      //       checkNumber(fulfillMedicine?.requested_qty) - checkNumber(fulfillMedicine?.dispatch_qty)
                      //   )
                      //     dispatchRequest()
                      // }}
                    >
                      cancel
                    </LoadingButton>
                    <LoadingButton
                      size='large'
                      variant='contained'
                      loading={submitLoader}
                      type='submit'

                      // onClick={() => {
                      //   const count = Object.values(rowErrors).filter(item => item.status).length
                      //   if (
                      //     count <= 0 &&
                      //     totalMedicine <=
                      //       checkNumber(fulfillMedicine?.requested_qty) - checkNumber(fulfillMedicine?.dispatch_qty)
                      //   )
                      //     dispatchRequest()
                      // }}
                    >
                      Save
                    </LoadingButton>
                  </Box>
                )}
                {openSnackbar.open ? (
                  <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
                ) : null}
              </Grid>
            </>
          </form>
          {/* </CardContent> */}
          <ConfirmDialogBox
            open={invalidQtyDialog}
            closeDialog={() => {
              closeConfirmationDialog()
            }}
            action={() => {
              closeConfirmationDialog()
            }}
            content={
              <Box>
                <>
                  <DialogContent>
                    <DialogContentText sx={{ mb: 1 }}>
                      You are trying to full fill higher quantity than it is available in that batch
                    </DialogContentText>
                    <Table>
                      <TableRow>
                        <TableCell sx={{ borderRight: '1px solid #ccc' }}>Batch no</TableCell>
                        <TableCell sx={{ borderRight: '1px solid #ccc' }}>Available qty</TableCell>
                        <TableCell>Requested qty</TableCell>
                      </TableRow>
                      {invalidQty?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item?.batch_no}</TableCell>
                          <TableCell>{item?.quantityAvailable}</TableCell>
                          <TableCell>{item?.qty}</TableCell>
                        </TableRow>
                      ))}
                    </Table>
                  </DialogContent>
                  <DialogContentText sx={{ mb: 1 }}>Confirm to proceed</DialogContentText>
                  <DialogActions className='dialog-actions-dense'>
                    <Button
                      size='small'
                      variant='contained'
                      color='primary'
                      onClick={() => {
                        handleConfirmDispatch()
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant='contained'
                      size='small'
                      color='error'
                      onClick={() => {
                        closeConfirmationDialog()
                      }}
                    >
                      Cancel
                    </Button>
                  </DialogActions>
                </>
              </Box>
            }
          />

          {/* <ConfirmDialog
            open={invalidQtyDialog}
            title={'Your quantity exceeds the batch limit'}
            closeDialog={() => {
              closeConfirmationDialog()
            }}
            action={() => {
              handleConfirmDispatch()
            }}
            content={
              <>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#e3e3e3' }}>
                      <TableCell sx={{ py: 1, borderRight: '1px solid #ccc' }}>Batch no</TableCell>
                      <TableCell sx={{ borderRight: '1px solid #ccc' }}>Available qty</TableCell>
                      <TableCell>Requested qty</TableCell>
                    </TableRow>
                  </TableHead>
                  {invalidQty?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell
                        sx={{
                          py: 1,
                          borderRight: '1px solid #ccc',
                          borderBottom: index === invalidQty.length - 1 && 'none'
                        }}
                      >
                        {item?.batch_no}
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          borderRight: '1px solid #ccc',
                          borderBottom: index === invalidQty.length - 1 && 'none'
                        }}
                      >
                        {item?.quantityAvailable}
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          borderRight: '1px solid #ccc',
                          borderBottom: index === invalidQty.length - 1 && 'none'
                        }}
                      >
                        {item?.qty}
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              </>
            }
          /> */}

          {/* {batchItems.length > 0 ? (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                <TableHead>
                  <TableRow>
                    <TableCell>Batch</TableCell>
                    <TableCell align='center'>Expiring</TableCell>
                    <TableCell align='center'>Quantity Available</TableCell>
                    <TableCell align='center'>Enter Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchItems?.map((row, index) => (
                    <TableRow
                      key={`batch_central_${index}`}
                      sx={{
                        '&:last-of-type td, &:last-of-type th': {
                          border: 0
                        }
                      }}
                    >
                      <TableCell component='th' scope='row'>
                        {row.batch_no}
                      </TableCell>
                      <TableCell align='center'>{row.expiry_date}</TableCell>
                      <TableCell align='center'>{row.qty}</TableCell>
                      <TableCell align='center'>
                        <TextField
                          size='small'
                          name={`batch_central_${index}`}
                          error={rowErrors[`batch_central_${index}`]?.status}
                          onChange={e => {
                            console.log(e.target.value)
                            handleQuantityChange(e.target.value, row, `batch_central_${index}`)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <CardContent>Medicine Not Available in central store.</CardContent>
          )} */}
          {/* <CardContent>
            <div>
              <StyledText onClick={toggleLocalTable}>Show stock in other stores</StyledText>
            </div>
          </CardContent>
          {isLocalTableVisible ? (
            <>
              {localBatchItems.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Store</TableCell>
                        <TableCell>Batch</TableCell>
                        <TableCell align='center'>Expiring</TableCell>
                        <TableCell align='center'>Quantity Available</TableCell>
                        <TableCell align='center'>Enter Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {localBatchItems?.map((row, index) => (
                        <TableRow
                          key={`batch_local_${index}`}
                          sx={{
                            '&:last-of-type td, &:last-of-type th': {
                              border: 0
                            }
                          }}
                        >
                          <TableCell component='th' scope='row'>
                            {row.store_name}
                          </TableCell>
                          <TableCell component='th' scope='row'>
                            {row.batch_no}
                          </TableCell>
                          <TableCell align='center'>{row.expiry_date}</TableCell>
                          <TableCell align='center'>{row.qty}</TableCell>
                          <TableCell align='center'>
                            <TextField
                              size='small'
                              name={`batch_local_${index}`}
                              error={rowErrors[`batch_local_${index}`]?.status}
                              onChange={e => {
                                console.log(e.target.value)
                                handleQuantityChange(e.target.value, row, `batch_local_${index}`)
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <CardContent>Medicine Not Available in other stores.</CardContent>
              )}
            </>
          ) : null} */}
        </Box>
      )}
    </>
  )
}

export default FulfillDialog
