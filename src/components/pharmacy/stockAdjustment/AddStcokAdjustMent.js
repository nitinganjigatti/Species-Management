/* eslint-disable lines-around-comment */
// ** MUI Imports
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import TableContainer from '@mui/material/TableContainer'
import TableCell from '@mui/material/TableCell'
import { CardHeader } from '@mui/material'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import { LoaderIcon } from 'react-hot-toast'
import Utility from 'src/utility'

import Router from 'next/router'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'
// ** React Imports
import { forwardRef, useState, useEffect, useCallback } from 'react'

import CommonDialogBox from 'src/components/CommonDialogBox'
import { debounce } from 'lodash'

import { getMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import { getAvailableMedicineByMedicineIdToReturn } from 'src/lib/api/pharmacy/getRequestItemsList'

import { getReasonsList, addStocksAdjust } from 'src/lib/api/pharmacy/stockAdjustment'
import { usePharmacyContext } from 'src/context/PharmacyContext'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

import { useForm, Controller, get } from 'react-hook-form'
import {
  Grid,
  FormControl,
  Autocomplete,
  TextField,
  FormHelperText,
  Button,
  Typography,
  CircularProgress
} from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddStockAdjustment = () => {
  const defaultValues = {
    batch_no: '',
    stock_id: '',
    adjustment_quantity: '',
    reason: '',
    comments: '',
    availableQty: '',
    expiry_date: ''
  }

  const schema = yup.object().shape({
    adjustment_quantity: yup
      .number()
      .required('Quantity is required')

      .typeError('Quantity must be a number')
      .positive('Quantity must be a positive number')
      .moreThan(0, 'Quantity must be greater than zero')
      .test('is-less-than-available', 'Quantity must be less than available quantity', function (value) {
        return value <= this.parent.availableQty
      }),

    reason: yup.string().required('Reason is required')
  })

  // ** Hook
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [loader, setLoader] = useState(false)

  const [stockAdjustmentDialog, setStockAdjustmentDialog] = useState(false)
  const [optionsBatchList, setOptionsBatchList] = useState([])
  const [reasons, setReasons] = useState([])
  const [selectedStockId, setSelectedStockId] = useState('')
  const [ConfirmDialog, setConfirmDialog] = useState(false)
  const [tempItems, setTempItems] = useState(null)
  const router = useRouter()
  const { selectedPharmacy } = usePharmacyContext()
  const { id, action } = router.query

  const openStockDialog = () => {
    setStockAdjustmentDialog(true)
  }

  const closeStockDialog = () => {
    setStockAdjustmentDialog(false)
    reset(defaultValues)
  }

  const openConfirmDialog = () => {
    setConfirmDialog(true)
  }

  const closeConfirmDialog = () => {
    setConfirmDialog(false)
  }

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

  //  ****** debounce
  const fetchBatchData = async (id, productType) => {
    if (id !== '') {
      try {
        const data = { stock_item_id: id }
        const searchResults = await getAvailableMedicineByMedicineIdToReturn(id, data, 'local', productType, 1)
        setLoader(true)
        if (searchResults?.success) {
          if (searchResults?.data?.items.length > 0) {
            const data = searchResults?.data?.items?.map(item => ({
              batchNumber: item?.batch_no,
              stockItemId: item?.stock_item_id,
              productName: item?.stock_item_name,
              expiryDate: item?.expiry_date,
              availableQty: item?.qty,
              packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
              manufacture: item?.manufacturer_name
            }))
            const filtered = data.filter(el => Number(el.availableQty) > 0)
            setOptionsBatchList(filtered)
            setLoader(false)
          }
        } else {
          setOptionsBatchList([])

          toast.error(searchResults?.data)
          setLoader(false)
        }
      } catch (e) {
        console.log('error', e)
        setOptionsBatchList([])
        setLoader(false)
      }
    }
  }

  const searchBatchData = useCallback(
    debounce(async (id, productType) => {
      try {
        await fetchBatchData(id, productType)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )
  useEffect(() => {
    searchBatchData(selectedStockId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.id])

  const fetchMedicineData = async searchText => {
    try {
      var params = {
        sort: 'asc',
        q: searchText,
        limit: 20
      }

      const searchResults = await getMedicineList({ params: params })
      if (searchResults?.data?.list_items.length > 0) {
        setOptionsMedicineList(
          searchResults?.data?.list_items?.map(item => ({
            value: item.id,
            name: item.name,
            package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
            label: `${item.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
            manufacture: item.manufacturer_name,
            stockType: item.stock_type
          }))
        )
      }
    } catch (e) {
      console.log('error', e)
    }
  }

  const searchMedicineData = useCallback(
    debounce(async searchText => {
      try {
        await fetchMedicineData(searchText)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )

  const getReasonsLists = async () => {
    try {
      const results = await getReasonsList()
      if (results?.success === true && results?.data?.length > 0) {
        setReasons(results?.data)
      }
    } catch (error) {
      console.log('error', error)
    }
  }
  useEffect(() => {
    fetchMedicineData('')
    getReasonsLists()
  }, [selectedPharmacy.id])

  //  ****** debounce
  const onSubmit = async params => {
    const { batch_no, stock_id, adjustment_quantity, reason, comments, expiry_date } = {
      ...params
    }
    setTempItems(params)
    openConfirmDialog()

    // try {
    //   setSubmitLoader(true)
    //   const results = await addStocksAdjust(params)
    //   console.log('results reason', results)
    //   if (results?.success === true) {
    //     console.log('results', results)
    //     toast.success(results?.msg)
    //     reset(defaultValues)
    //     setSubmitLoader(false)
    //     closeStockDialog()
    //     searchBatchData(stock_id)
    //   } else {
    //     toast.error(results?.msg)
    //     setSubmitLoader(false)
    //   }
    // } catch (error) {
    //   console.log('error', error)
    // }
  }

  const confirmSubmit = async () => {
    try {
      setSubmitLoader(true)
      const results = await addStocksAdjust(tempItems)
      if (results?.success === true) {
        toast.success(results?.msg)
        reset(defaultValues)
        setSubmitLoader(false)
        closeStockDialog()
        searchBatchData(tempItems?.stock_id)
        setTempItems(null)
        setConfirmDialog(false)
      } else {
        toast.error(results?.msg)
        setSubmitLoader(false)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  // data posting section
  const createForm = () => {
    return (
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
        <Grid container spacing={5} xs={12}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='batch_no'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    disabled
                    type=''
                    value={value}
                    label='Batch number'
                    name='batch_no'
                    error={Boolean(errors.batch_no)}
                    onChange={onChange}
                  />
                )}
              >
                {errors.batch_no && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.batch_no?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='availableQty'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    disabled
                    type='number'
                    value={value}
                    label='Available Quantity'
                    name='availableQty'
                    error={Boolean(errors.availableQty)}
                    onChange={onChange}
                  />
                )}
              >
                {errors.availableQty && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.availableQty?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <Controller
                name='adjustment_quantity'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    type='number'
                    value={value}
                    label='Reduce by*'
                    name='adjustment_quantity'
                    error={Boolean(errors.adjustment_quantity)}
                    onChange={onChange}
                  />
                )}
              >
                {errors.adjustment_quantity && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.adjustment_quantity?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel error={Boolean(errors?.reason)}>Select reason*</InputLabel>
              <Controller
                name='reason'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Select
                    name='reason'
                    value={value}
                    label='Select reason*'
                    onChange={onChange}
                    error={Boolean(errors?.reason)}
                  >
                    {reasons.length > 0
                      ? reasons.map((el, index) => {
                          return (
                            <MenuItem key={index} value={el?.id}>
                              {el?.reason}
                            </MenuItem>
                          )
                        })
                      : null}
                  </Select>
                )}
              />
              {errors?.reason && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.reason?.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <Controller
                name='comments'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    multiline
                    rows={2}
                    type='text'
                    value={value}
                    label='Comments'
                    name='comments'
                    error={Boolean(errors.comments)}
                    onChange={onChange}
                  />
                )}
              >
                {errors.comments && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors?.comments?.message}</FormHelperText>
                )}
              </Controller>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ float: 'right' }}>
              <LoadingButton loading={submitLoader} sx={{ mr: 2 }} type='submit' size='large' variant='contained'>
                Save
              </LoadingButton>
            </Box>
          </Grid>
        </Grid>
        <ConfirmDialogBox
          open={ConfirmDialog}
          closeDialog={() => {
            closeConfirmDialog()
          }}
          action={() => {
            closeConfirmDialog()
          }}
          content={
            <Box sx={{ m: 0 }}>
              <>
                <DialogContent>
                  <DialogContentText sx={{ mb: 3 }}>Are you sure..?</DialogContentText>
                </DialogContent>
                <DialogActions className='dialog-actions-dense'>
                  <LoadingButton
                    variant='contained'
                    color='error'
                    size='small'
                    onClick={() => {
                      closeConfirmDialog()
                    }}
                  >
                    Cancel
                  </LoadingButton>

                  <LoadingButton
                    onClick={() => {
                      confirmSubmit()
                    }}
                    loading={submitLoader}
                    sx={{ mr: 2 }}
                    size='small'
                    variant='contained'
                  >
                    Save
                  </LoadingButton>
                </DialogActions>
              </>
            </Box>
          }
        />
      </form>
    )
  }

  return (
    <Card>
      <Grid
        container
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <CardHeader
          avatar={
            <Icon
              style={{ cursor: 'pointer' }}
              onClick={() => {
                Router.push('/pharmacy/stocks-adjustments/stock-adjustment-list/')
              }}
              icon='ep:back'
            />
          }
          title={id ? 'Stock Adjustment' : 'Add Stock Adjustment'}
        />
      </Grid>

      <CardContent>
        <form>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                  <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                    Search product :
                  </Typography>
                </Grid>
                <FormControl fullWidth>
                  <Autocomplete
                    id='autocomplete-controlled'
                    options={optionsMedicineList}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography>{option.name}</Typography>
                          <Typography variant='body2'>{option.package}</Typography>
                          <Typography variant='body2'>{option.manufacture}</Typography>
                        </Box>
                      </li>
                    )}
                    // value={value}
                    onChange={(event, newValue) => {
                      if (newValue?.value && newValue?.stockType) {
                        searchBatchData(newValue?.value, newValue?.stockType)
                        setSelectedStockId(newValue?.value)
                      }
                      if (newValue === '' || newValue === null) {
                        setOptionsBatchList([])
                      }
                    }}
                    onKeyUp={e => {
                      searchMedicineData(e.target.value)
                    }}
                    onBlur={() => {
                      fetchMedicineData('')
                    }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        placeholder='Search & Select'
                        label='Product Name*'
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: <InputAdornment position='end'>{params.InputProps.endAdornment}</InputAdornment>
                        }}
                      />
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
            {loader ? <CircularProgress size={60} /> : null}
          </Grid>
        </form>
      </CardContent>
      {optionsBatchList?.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
              <TableRow>
                <TableCell>Sl.NO</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Batch Number</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Adjust</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {optionsBatchList
                ? optionsBatchList?.map((el, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>

                        <TableCell>
                          <Typography variant='body2' sx={{ color: 'text.primary' }}>
                            {el.productName}
                          </Typography>
                          <Typography variant='body2'>{el.packageDetails}</Typography>
                        </TableCell>

                        <TableCell>{el.batchNumber}</TableCell>

                        <TableCell>{Utility.formatDisplayDate(el.expiryDate)} </TableCell>
                        <TableCell>{el.availableQty}</TableCell>
                        <TableCell>
                          <Button
                            variant='contained'
                            onClick={() => {
                              reset({
                                batch_no: el?.batchNumber,
                                stock_id: el?.stockItemId,
                                availableQty: el?.availableQty,
                                expiry_date: el?.expiryDate,
                                adjustment_quantity: el?.availableQty
                              })
                              openStockDialog()
                            }}
                          >
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                : null}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <Grid container>
        <CommonDialogBox
          title={'Add Stock Adjustment Details'}
          dialogBoxStatus={stockAdjustmentDialog}
          formComponent={createForm()}
          close={closeStockDialog}
          show={openStockDialog}
        />
      </Grid>
    </Card>
  )
}

export default AddStockAdjustment
