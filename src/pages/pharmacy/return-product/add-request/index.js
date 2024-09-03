/* eslint-disable lines-around-comment */
// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Divider from '@mui/material/Divider'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import TableContainer from '@mui/material/TableContainer'
import TableCell from '@mui/material/TableCell'
import { Button, CardHeader } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import FormHelperText from '@mui/material/FormHelperText'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
// ** React Imports
import { forwardRef, useState, useEffect, useCallback } from 'react'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CustomChip from 'src/@core/components/mui/chip'

import { v4 as uuidv4 } from 'uuid'

import CommonDialogBox from 'src/components/CommonDialogBox'
import SingleDatePicker from 'src/components/SingleDatePicker'
import { debounce } from 'lodash'

import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getLocalMedicineList } from 'src/lib/api/pharmacy/getMedicineList'
import { getAvailableMedicineByMedicineIdToReturn } from 'src/lib/api/pharmacy/getRequestItemsList'

import {
  addReturnItems,
  updateReturnItems,
  getReturnItemsListById,
  cancelReturnItemsRequest
} from 'src/lib/api/pharmacy/returnRequest'
// import { deleteLineItem } from 'src/lib/api/pharmacy/getRequestItemsList'
import Utility from 'src/utility'
import { AddItemsForm } from 'src/views/pages/pharmacy/return/add-items-form'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'

const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { boolean } from 'yup'
import { AddButton, RequestCancelButton } from 'src/components/Buttons'

const editParamsInitialState = {
  // from_store_type: '',
  to_store_type: '',

  // from_store_id: '',
  to_store_id: '',
  // from_store_type: '',
  ro_date: Utility.formattedPresentDate(),
  total_qty: '',
  priority_item: 'Normal',
  request_item_details: []
}

const initialNestedRowMedicine = {
  request_item_medicine_id: '',
  medicine_name: '',
  request_item_qty: '',
  request_item_leaf_id: '',
  priority_item: 'Normal',
  control_substance: false,
  control_substance_file: '',
  uuid: '',
  stock_type: ''
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddReturnRequest = () => {
  // ** Hook
  const [toStocks, setToStocks] = useState([])
  const [fromStocks, setFromStocks] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [optionsBatchList, setOptionsBatchList] = useState([])
  const [totalBatchQuantity, setTotalBatchQuantity] = useState(0)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [itemErrors, setItemErrors] = useState({})
  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [duplicateMedError, setDuplicateMedError] = useState('')

  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)

  const [productLoading, setProductLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  // const [deleteItemId, setDeleteItemId] = useState('')
  // const [deleteDialog, setDeleteDialog] = useState(false)
  const [cancelRequestDialog, setCancelRequestDialog] = useState(false)
  const router = useRouter()
  const { id, action } = router.query

  const { selectedPharmacy } = usePharmacyContext()

  const storesType = {
    local: 1,
    central: 2
  }

  const filteredStoreType = value => {
    const storeType = fromStocks?.find(item => item.id == value)?.type

    return storeType
  }

  const openCancelDialog = () => {
    setCancelRequestDialog(true)
  }

  const closeCancelDialog = () => {
    setCancelRequestDialog(false)
  }

  const closeDialog = () => {
    setShow(false)
    setNestedRowMedicine(initialNestedRowMedicine)
    setMedicineItemId('')
    setDuplicateMedError('')
    // Resetting State
    setOptionsBatchList([])
    // setOptionsMedicineList([])
    setTotalBatchQuantity(0)
  }

  const showDialog = () => {
    setShow(true)
  }

  // local nested items delete
  const removeItemsFromTable = itemId => {
    const updatedItems = editParams.request_item_details.filter(el => {
      return el.uuid != itemId
    })
    setEditParams({ ...editParams, request_item_details: updatedItems })
    setMedicineItemId('')
  }

  const totalQty = editParams.request_item_details?.reduce((acc, row) => acc + parseInt(row.request_item_qty), 0)

  const addItemsToTable = params => {
    const updatedNestedRows = [...editParams.request_item_details, params]
    setEditParams({
      ...editParams,
      request_item_details: updatedNestedRows
    })

    setNestedRowMedicine(initialNestedRowMedicine)
  }
  function formatDate(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }
  function parseFormattedDate(formattedDate) {
    const parts = formattedDate.split('-')
    const year = parts[0]
    const month = Number(parts[1]) - 1
    const day = parts[2]

    return new Date(year, month, day)
  }

  const validate = values => {
    const itemErrors = {}
    if (!values.medicine_name || values.medicine_name === '') {
      itemErrors.medicine_name = 'This field is required'
    }
    if (!values.request_item_qty) {
      itemErrors.request_item_qty = 'This field is required'
    }
    if (!values.priority_item) {
      itemErrors.priority_item = 'This field is required'
    }
    if (!values.control_substance_file) {
      itemErrors.control_substance_file = 'This field is required'
    }
    // if (values.control_substance) {
    if (values.control_substance === true) {
      if (values.control_substance_file.length === 0) {
        itemErrors.control_substance_file = 'This field is required'
      }
    }
    // itemErrors.control_substance = 'This field is required'
    // }

    return itemErrors
  }

  const validateItems = values => {
    const errors = {}

    // if (!values.from_store_id) {
    //   errors.from_store_id = 'This field is required'
    // }
    if (!values.to_store_id) {
      errors.to_store_id = 'This field is required'
    }
    if (!values.ro_date) {
      errors.ro_date = 'This field is required'
    }

    return errors
  }

  const submitItems = params => {
    // const HasErrors =
    //   !nestedRowMedicine.medicine_name || !nestedRowMedicine.request_item_qty || !nestedRowMedicine.priority_item
    // // || !nestedRowMedicine.control_substance
    // if (HasErrors) {
    //   setItemErrors(validate(nestedRowMedicine))

    //   return
    // }
    // if (params.control_substance === true) {
    //   if (nestedRowMedicine.control_substance_file.length === 0) {
    //     setItemErrors(validate(nestedRowMedicine))

    //     return
    //   }
    // }

    setDuplicateMedError(false)

    const isMedicineAlreadyExists = editParams.request_item_details.some(
      item =>
        item.request_item_medicine_id === params.request_item_medicine_id &&
        item.request_item_batch_no === params.request_item_batch_no &&
        params.uuid !== item.uuid
    )

    if (isMedicineAlreadyExists) {
      setDuplicateMedError(true)
      console.log('Medicine already exists')

      return
    }
    setErrors({})
    var tempParams = params
    if (tempParams?.uuid === '') {
      tempParams.uuid = uuidv4()
      addItemsToTable(tempParams)
    } else {
      updateFormItems(params)
    }

    closeDialog()
  }

  const updateTableItems = params => {
    const itemId = medicineItemId
    const updatedState = { ...editParams }

    const updatedIndex = updatedState.request_item_details.findIndex(row => row.uuid === params.uuid)

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState.request_item_details]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...params
      }
      updatedState.request_item_details = updatedNestedRows

      setEditParams(updatedState)
      setNestedRowMedicine(initialNestedRowMedicine)
      setMedicineItemId('')
    } else {
      console.error('updateTable Items error')
    }
  }

  const updateFormItems = params => {
    const HasErrors = !params.product_name || !params.request_item_qty || !params.priority_item
    // ||!nestedRowMedicine.control_substance
    if (HasErrors) {
      setItemErrors(validate(params))

      return
    }
    if (params.control_substance === true) {
      if (params.control_substance_file.length === 0) {
        setItemErrors(validate(params))

        return
      }
    }
    setErrors({})
    updateTableItems(params)
  }

  const handleSubmit = () => {
    const formHasErrors = !editParams.to_store_id || !editParams.ro_date
    if (formHasErrors) {
      setErrors(validateItems(editParams))

      return
    }

    setErrors({})
    showDialog()
  }

  const filterToStocks = id => {
    const optionsForSelectB = fromStocks.filter(option => option.id !== id)
    setToStocks(optionsForSelectB)
  }

  const getStoresLists = async () => {
    // setLoader(true)
    try {
      const response = await getStoreList({ params: { type: 'central' } })
      if (response?.data?.list_items?.length > 0) {
        setFromStocks(response?.data?.list_items)
        setToStocks(response?.data?.list_items)
        if (response?.data?.list_items?.length === 1) {
          setEditParams({
            ...editParams,
            to_store_id: response?.data?.list_items[0].id,
            to_store_type: response?.data?.list_items[0].type
          })
        }
      }
    } catch (error) {
      console.log('err', error)
    }
  }

  //  ****** debounce
  const fetchMedicineData = async searchText => {
    try {
      setProductLoading(true)

      const params = {
        sort: 'asc',
        q: searchText,
        limit: 20,
        page: 1,
        column: 'stock_items_name',
        store_id: selectedPharmacy.id
      }

      const searchResults = await getLocalMedicineList({ params: params })
      console.log('searchResults', searchResults)
      if (searchResults?.data?.length > 0) {
        setOptionsMedicineList(
          searchResults?.data?.map(item => ({
            value: item.stock_item_id,
            label: item.stock_items_name,
            control_substance: item.controlled_substance === '1' ? true : false,
            stock_type: item?.stock_type,
            packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
            manufacture: item?.manufacturer_name
          }))
        )
      }
      setProductLoading(false)
    } catch (e) {
      console.log('error', e)
      setProductLoading(false)
    }
  }

  const fetchBatchData = async (id, productType) => {
    if (id !== '') {
      try {
        setBatchLoading(true)
        const data = { stock_item_id: id }
        const searchResults = await getAvailableMedicineByMedicineIdToReturn(id, data, 'local', productType, 1)
        if (searchResults?.success) {
          if (searchResults?.data?.items.length > 0) {
            // console.log('data of batch', searchResults?.data?.items)
            setOptionsBatchList(
              searchResults?.data?.items?.map(item => ({
                value: item?.batch_no,
                label: item?.batch_no,
                expiry_date: item?.expiry_date,
                available_item_qty: item?.qty,
                packageDetails: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
                manufacture: item?.manufacturer_name
              }))
            )
            setTotalBatchQuantity(searchResults?.data?.total_quantity)
          } else {
            setTotalBatchQuantity(0)
          }
        } else {
          setOptionsBatchList([])
          setTotalBatchQuantity(0)
        }
        setBatchLoading(false)
      } catch (e) {
        console.log('error', e)
        setBatchLoading(false)
        setOptionsBatchList([])
        setTotalBatchQuantity(0)
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
    if (id != undefined && action === 'edit') {
      getListOfItemsById(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, action])

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
  //  ****** debounce

  useEffect(() => {
    getStoresLists()
    fetchMedicineData()
  }, [])

  const getListOfItemsById = async id => {
    try {
      const result = await getReturnItemsListById(id)

      if (result?.success === true && result?.data?.request_item_details?.length > 0) {
        const lineItems = result?.data?.request_item_details.map(el => {
          return {
            request_item_medicine_id: el.stock_item_id,
            // medicine_name: el.stock_name,
            product_name: el.stock_name,
            request_item_qty: el.qty,
            request_item_leaf_id: el.stock_item_id,
            priority_item: el.priority,
            control_substance: el.control_substance === '0' ? false : true,
            control_substance_file: el.control_substance_file !== '' ? el.control_substance_file : '',
            id: el.id,
            request_item_detail_id: el.id,
            request_item_batch_no: el.dispatch_batch_no,
            expiry_date: el.dispatch_expiry_date,
            uuid: uuidv4(),
            available_item_qty: el?.batch_available_qty,
            dispatch_item_id: el?.dispatch_item_id,
            stock_type: el?.stock_type,
            packageDetails: `${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`,
            manufacture: el?.manufacturer
          }
        })

        setEditParams({
          ...editParams,
          id: result?.data?.id,
          dispatch_id: result?.data?.dispatch_id,
          // from_store_id: result?.data?.from_store_id,
          to_store_id: result?.data?.to_store_id,
          ro_date: result?.data?.request_date,
          // from_store_type: result?.data?.from_store_type,
          to_store_type: result?.data?.to_store_type,
          request_item_details: lineItems
        })
        // }
      }
    } catch (error) {}
  }

  // ****** edit section //////
  const editTableData = async itemId => {
    const getItems = editParams.request_item_details.filter(el => {
      return el.uuid === itemId
    })
    setNestedRowMedicine({
      ...nestedRowMedicine,
      medicine_name: getItems[0].product_name,
      request_item_medicine_id: getItems[0].request_item_medicine_id,
      request_item_batch_no: getItems[0].request_item_batch_no,
      expiry_date: getItems[0].expiry_date,
      // id: getItems[0].id,
      request_item_qty: getItems[0].request_item_qty,
      control_substance_file: getItems[0].control_substance_file ? getItems[0].control_substance_file : '',
      priority_item: getItems[0].priority_item,
      control_substance: getItems[0].control_substance,
      uuid: getItems[0].uuid,
      available_item_qty: getItems[0]?.available_item_qty,
      stock_type: getItems[0]?.stock_type,
      packageDetails: getItems[0]?.packageDetails,
      manufacture: getItems[0]?.manufacture
    })
    // }
    // await searchBatchData(itemId)
  }

  // ****** edit section //////
  // data posting section

  const postItemsData = async () => {
    setSubmitLoader(true)
    const postData = editParams
    postData.total_qty = totalQty
    if (id) {
      try {
        const response = await updateReturnItems(id, postData)

        if (response?.success) {
          toast.success(response?.message)
          setSubmitLoader(false)
          getListOfItemsById(id)

          Router.push(`/pharmacy/return-product/${response.data}`)
        } else {
          setSubmitLoader(false)

          toast.error(response?.errors ? response?.errors : response?.message)
        }
      } catch (error) {
        console.log('error', error)
      }
    } else {
      try {
        const response = await addReturnItems(postData)
        if (response?.success) {
          toast.success(response?.message)
          setEditParams(editParamsInitialState)
          setSubmitLoader(false)
          Router.push(`/pharmacy/return-product/${response.data}`)
        } else {
          setSubmitLoader(false)
          toast.error(response?.message)
        }
      } catch (error) {
        console.log('error', error)
      }
    }
  }

  // const deleteLineItemFromDb = async lineItemId => {
  //
  //   console.log('lineItemId', lineItemId)
  //   if (lineItemId) {
  //     try {
  //       const result = await deleteLineItem(lineItemId)
  //       console.log('deleteLineItem result', result)
  //       if (result?.data?.success === true) {
  //         toast.success(result?.data?.data)
  //         setDeleteDialog(false)
  //         setDeleteItemId(null)
  //         getListOfItemsById(id)
  //       } else {
  //         toast.error(result.data)
  //       }
  //     } catch (error) {
  //       toast.error(error.data)
  //       console.log('error', error)
  //     }
  //   }
  // }

  const cancelReturnRequest = async id => {
    if (id) {
      try {
        const result = await cancelReturnItemsRequest(id)
        if (result?.data?.success === true) {
          toast.success(result?.data?.data)
          Router.push(`/pharmacy/return-product/request-list/`)
        } else {
          toast.error(result.data)
        }
      } catch (error) {
        toast.error(error.data)
        console.log('error', error)
      }
    }
  }

  // const cancelReturnRequest = async id => {
  //
  //   console.log('id', id)
  //   if (id) {
  //     try {
  //       const result = await cancelReturnItemsRequest(id)
  //       console.log('cancelRequest result', result)
  //       if (result?.data?.success === true) {
  //         toast.success(result?.data?.data)
  //         Router.push(`/pharmacy/return-product/request-list/`)
  //       } else {
  //         toast.error(result.data)
  //       }
  //     } catch (error) {
  //       toast.error(error.data)
  //       console.log('error', error)
  //     }
  //   }
  // }

  // data posting section
  const createForm = () => {
    return (
      <AddItemsForm
        searchBatchData={searchBatchData}
        searchMedicineData={searchMedicineData}
        productList={optionsMedicineList}
        productLoading={productLoading}
        batchLoading={batchLoading}
        onSubmitData={submitItems}
        batchList={optionsBatchList}
        setBatchList={setOptionsBatchList}
        nestedMedicine={nestedRowMedicine}
        error={duplicateMedError}
        totalQuantity={totalBatchQuantity}
        editParams={editParams}
      />
    )
  }

  return (
    <>
      {selectedPharmacy.type === 'local' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
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
                    Router.push('/pharmacy/return-product/request-list/')
                  }}
                  icon='ep:back'
                />
              }
              title='Add Return Request'
            />
          </Grid>
          <CardContent>
            <Grid container>
              <CommonDialogBox
                title={'Add Return Item'}
                dialogBoxStatus={show}
                formComponent={createForm()}
                close={closeDialog}
                show={showDialog}
              />
            </Grid>
          </CardContent>
          <CardContent>
            <form>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={6}>
                  <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                    <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                      <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                        Returned to :
                      </Typography>
                    </Grid>
                    <FormControl fullWidth>
                      <InputLabel id='state_id' error={Boolean(errors.to_store_id)}>
                        Store*
                      </InputLabel>

                      <Select
                        error={Boolean(errors.to_store_id)}
                        value={editParams.to_store_id}
                        label='Store*'
                        disabled={id ? true : false}
                        onChange={e => {
                          setEditParams({
                            ...editParams,
                            to_store_id: e.target.value,
                            to_store_type: storesType[filteredStoreType(e.target.value)]
                          })
                          setErrors({})
                        }}
                        // error={Boolean(errors?.state_id)}
                        // labelId='state_id'
                      >
                        {toStocks?.map((item, index) => (
                          <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                            {item?.name}
                          </MenuItem>
                        ))}
                      </Select>

                      {errors.to_store_id && (
                        <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                          This field is required
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                    <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                      &nbsp;
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                    <FormControl fullWidth>
                      <SingleDatePicker
                        fullWidth
                        date={editParams.ro_date ? parseFormattedDate(editParams.ro_date) : null}
                        width={'100%'}
                        value={editParams.ro_date ? parseFormattedDate(editParams.ro_date) : null}
                        name={'Date*'}
                        onChangeHandler={date => {
                          // setStores({ ...stores, date: date })
                          setEditParams({ ...editParams, ro_date: formatDate(date) })
                          setErrors({})
                        }}
                        customInput={<CustomInput label='Date*' error={Boolean(errors.ro_date)} />}
                      />
                      {errors.ro_date && (
                        <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                          This field is required
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            </form>
          </CardContent>
          <Grid
            container
            spacing={6}
            sm={12}
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              mb: 4
            }}
          >
            <AddButton
              title='Add Return Item'
              action={() => {
                handleSubmit()
              }}
            />
          </Grid>

          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Batch No</TableCell>

                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editParams.request_item_details
                  ? editParams.request_item_details.map((el, index) => {
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {el.product_name}
                            </Typography>
                            {el.control_substance ? (
                              <CustomChip label='CS' skin='light' color='success' size='small' />
                            ) : null}
                            <Typography variant='body2'>{el.packageDetails}</Typography>
                            <Typography variant='body2'>{el.manufacture}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {el.request_item_batch_no}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {Utility.formatDisplayDate(el.expiry_date) === 'Invalid date' ? 'NA' : el.expiry_date}
                            </Typography>
                          </TableCell>
                          <TableCell>{el.priority_item}</TableCell>

                          <TableCell>{el.request_item_qty}</TableCell>

                          <TableCell>
                            <IconButton
                              size='small'
                              sx={{ mr: 0.5 }}
                              aria-label='Edit'
                              onClick={() => {
                                setMedicineItemId(el.request_item_medicine_id)

                                editTableData(el.uuid)
                                // editTableData(el.request_item_medicine_id)
                                showDialog()
                                // }
                              }}
                            >
                              <Icon icon='mdi:pencil-outline' />
                            </IconButton>
                            <IconButton
                              onClick={() => {
                                // if (editParams?.request_item_details?.length === 1) {
                                //   openCancelDialog()
                                // } else {
                                removeItemsFromTable(el.uuid)
                                // }
                              }}
                              size='small'
                              sx={{ mr: 0.5 }}
                            >
                              <Icon icon='mdi:delete-outline' />
                            </IconButton>
                            {/* {el.id !== undefined ? (
                              <IconButton
                                onClick={() => {
                                  if (editParams?.request_item_details?.length === 1) {
                                    openCancelDialog()
                                  } else {
                                    setDeleteItemId(el.id)
                                    setDeleteDialog(true)
                                  }

                                }}
                                size='small'
                                sx={{ mr: 0.5 }}
                              >
                                <Icon icon='mdi:delete-outline' />
                              </IconButton>
                            ) : null} */}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  : null}
              </TableBody>
            </Table>
          </TableContainer>
          <CardContent sx={{ pt: 8 }}>
            {totalQty ? (
              <Grid container>
                <Grid
                  item
                  xs={12}
                  sm={2}
                  lg={2}
                  sx={{
                    mb: { sm: 0, xs: 4 },
                    order: { sm: 2, xs: 1 },
                    marginLeft: 'auto',
                    mr: { sm: 12, xs: 0 }
                  }}
                >
                  <CalcWrapper>
                    <Typography variant='body2'>Total Qty:</Typography>
                    <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                      {totalQty}
                    </Typography>
                  </CalcWrapper>

                  <Divider
                    sx={{
                      mt: theme => `${theme.spacing(5)} !important`,
                      mb: theme => `${theme.spacing(3)} !important`
                    }}
                  />
                </Grid>
              </Grid>
            ) : null}
          </CardContent>

          <Grid item xs={12}>
            <Box sx={{ float: 'right', my: 4, mx: 6 }}>
              {id ? (
                <RequestCancelButton
                  title='Cancel Request'
                  action={() => {
                    openCancelDialog()
                    // setEditParams(editParamsInitialState)
                  }}
                />
              ) : null}
              <LoadingButton
                disabled={editParams.request_item_details.length > 0 ? false : true}
                sx={{ marginRight: '8px' }}
                size='large'
                onClick={() => {
                  postItemsData()
                }}
                variant='contained'
                loading={submitLoader}
              >
                Save
              </LoadingButton>
              {id ? null : (
                <Button
                  onClick={() => {
                    setEditParams(editParamsInitialState)
                  }}
                  size='large'
                  variant='outlined'
                >
                  Reset
                </Button>
              )}
            </Box>
          </Grid>
          {/* <ConfirmDialogBox
            open={deleteDialog}
            closeDialog={() => {
              setDeleteDialog(false)
              setDeleteItemId(null)
            }}
            action={() => {
              setDeleteDialog(false)
              setDeleteItemId(null)
            }}
            content={
              <Box>
                <>
                  <DialogContent>
                    <DialogContentText sx={{ mb: 1 }}>Are you sure you want to delete this item?</DialogContentText>
                  </DialogContent>
                  <DialogActions className='dialog-actions-dense'>
                    <Button
                      variant='contained'
                      size='small'
                      color='primary'
                      onClick={() => {
                        setDeleteDialog(false)
                        setDeleteItemId(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size='small'
                      variant='contained'
                      color='error'
                      onClick={() => {
                        deleteLineItemFromDb(deleteItemId)
                      }}
                    >
                      Confirm
                    </Button>
                  </DialogActions>
                </>
              </Box>
            }
          /> */}
          <ConfirmDialogBox
            open={cancelRequestDialog}
            closeDialog={() => {
              closeCancelDialog()
            }}
            action={() => {
              closeCancelDialog()
            }}
            content={
              <Box>
                <>
                  <DialogContent>
                    <DialogContentText sx={{ mb: 1 }}>Are you sure you want to Cancel this request?</DialogContentText>
                  </DialogContent>
                  <DialogActions className='dialog-actions-dense'>
                    <Button
                      variant='contained'
                      size='small'
                      color='primary'
                      onClick={() => {
                        closeCancelDialog()
                      }}
                    >
                      No
                    </Button>
                    <Button
                      size='small'
                      variant='contained'
                      color='error'
                      onClick={() => {
                        cancelReturnRequest(id)
                      }}
                    >
                      Yes
                    </Button>
                  </DialogActions>
                </>
              </Box>
            }
          />
          <ConfirmDialogBox
            open={cancelRequestDialog}
            closeDialog={() => {
              closeCancelDialog()
            }}
            action={() => {
              closeCancelDialog()
            }}
            content={
              <Box>
                <>
                  <DialogContent>
                    <DialogContentText sx={{ mb: 1 }}>
                      Are you sure you want to Cancel this request? If you cancel this request it will be disabled you
                      cannot perform any operations for this request
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions className='dialog-actions-dense'>
                    <Button
                      variant='contained'
                      size='small'
                      color='primary'
                      onClick={() => {
                        closeCancelDialog()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size='small'
                      variant='contained'
                      color='error'
                      onClick={() => {
                        cancelReturnRequest(id)
                      }}
                    >
                      Confirm
                    </Button>
                  </DialogActions>
                </>
              </Box>
            }
          />
        </Card>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default AddReturnRequest
