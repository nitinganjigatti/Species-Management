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
import Router from 'next/router'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'

// ** React Imports
import { forwardRef, useState, useEffect } from 'react'
// ** Icon Imports
import Icon from 'src/@core/components/icon'

import { debouncedSearchCommon, generateErrMsg } from 'src/components/utility/debounce'
import { getStoreList } from 'src/lib/api/getStoreList'
import { getSuppliers } from 'src/lib/api/getSupplierList'
import { getMedicineBySearch, getMedicineToAddPurchase } from 'src/lib/api/getMedicineBySearch'
import { addPurchase, getPurchaseListById, updatePurchase } from 'src/lib/api/getPurchaseList'
import CommonDialogBox from 'src/components/CommonDialogBox'
import SingleDatePicker from '../../SingleDatePicker'

const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))

const editParamsInitialState = {
  po_no: '',
  po_date: '',
  store_id: '',
  supplier_id: '',
  description: '',
  type_of_store: '',
  purchase_details: [],

  expected_delivery_date: '',
  delivery_date: '',

  transport_details: '',
  transport_charge: '',
  total_amount: '',
  cgst: '',
  sgst: '',
  igst: '',
  tax_amount: '',
  taxeble_amount: '',
  discount_type: '',
  discount_amount: '',
  discount_percentage: '',
  net_amount: '',
  paid_amount: ''
}

const initialNestedRowMedicine = {
  medicine_name: '',
  purchase_unit_id: '',
  purchase_stock_item_id: '',

  purchase_qty: 0,
  // supplier_price: '',

  purchase_unit_price: 0,
  purchase_purchase_price: 0,

  purchase_batch_no: '',
  purchase_expiry_date: '',
  min_stock_qty: '',
  purchase_gst_type: '',
  purchase_cgst: '',
  purchase_sgst: '',
  purchase_igst: '',
  purchase_tax_amount: '',
  purchase_taxeble_amount: '',
  purchase_net_amount: '',
  purchase_discount_amount: '',
  purchase_discount_type: '',
  purchase_is_before_tax: ''
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddPurchaseForm = () => {
  // ** Hook
  const [stores, setStores] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [itemErrors, setItemErrors] = useState({})

  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [duplicateMedError, setDuplicateMedError] = useState('')

  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)
  const router = useRouter()
  const { id, action } = router.query

  const closeDialog = () => {
    setShow(false)
    setNestedRowMedicine(initialNestedRowMedicine)
    setMedicineItemId('')
  }

  const showDialog = () => {
    setShow(true)
  }

  const getStoreType = id => {
    const foundOStores = stores.find(item => item.id === id)
    if (foundOStores) {
      const storeType = foundOStores.type
      setEditParams({ ...editParams, store_id: id, type_of_store: storeType })
    }
  }

  // local nested items delete
  const removeItemsFroTable = itemId => {
    const updatedItems = editParams.purchase_details.filter(el => {
      return el.purchase_unit_id != itemId
    })
    setEditParams({ ...editParams, purchase_details: updatedItems })
    setMedicineItemId('')
  }

  const totalQty = editParams.purchase_details?.reduce((acc, row) => acc + parseInt(row.purchase_qty), 0)
  console.log(totalQty)

  const addItemsToTable = () => {
    const newData = {
      medicine_name: nestedRowMedicine.medicine_name,
      purchase_unit_id: nestedRowMedicine.purchase_unit_id,
      // id: nestedRowMedicine.id,
      purchase_qty: nestedRowMedicine.purchase_qty,
      // dosageForm: nestedRowMedicine.dosageForm,
      priority_item: nestedRowMedicine.priority_item,
      control_substance: nestedRowMedicine.control_substance,
      control_substance_file: nestedRowMedicine.control_substance_file
    }

    const updatedNestedRows = [...editParams.purchase_details, newData]
    console.log(updatedNestedRows)
    setEditParams({
      ...editParams,
      purchase_details: updatedNestedRows
    })

    setNestedRowMedicine(initialNestedRowMedicine)
    console.log('last', nestedRowMedicine)
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
    if (!values.purchase_qty) {
      itemErrors.purchase_qty = 'This field is required'
    }
    if (!values.priority_item) {
      itemErrors.priority_item = 'This field is required'
    }
    if (!values.control_substance_file) {
      itemErrors.control_substance_file = 'This field is required'
    }
    // if (values.control_substance) {
    if (values.control_substance === 'yes') {
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

    if (!values.po_no) {
      errors.po_no = 'This field is required'
    }
    if (!values.store_id) {
      errors.store_id = 'This field is required'
    }
    if (!values.supplier_id) {
      errors.supplier_id = 'This field is required'
    }
    if (!values.po_date) {
      errors.po_date = 'This field is required'
    }

    return errors
  }

  const submitItems = () => {
    const HasErrors =
      !nestedRowMedicine.medicine_name ||
      !nestedRowMedicine.purchase_qty ||
      !nestedRowMedicine.priority_item ||
      !nestedRowMedicine.control_substance
    if (HasErrors) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }
    if (nestedRowMedicine.control_substance === 'yes') {
      if (nestedRowMedicine.control_substance_file.length === 0) {
        setItemErrors(validate(nestedRowMedicine))

        return
      }
    }

    const isMedicineAlreadyExists = editParams.purchase_details.some(
      item => item.medicine_name === nestedRowMedicine.medicine_name
    )

    if (isMedicineAlreadyExists) {
      setDuplicateMedError('Medicine already exists')

      return
    }
    setErrors({})
    addItemsToTable()
  }

  const updateTableItems = () => {
    const itemId = medicineItemId
    const updatedState = { ...editParams }
    console.log('beforeupdate editParams', editParams)

    const updatedIndex = id
      ? updatedState.purchase_details.findIndex(row => row.stock_item_id === medicineItemId)
      : updatedState.purchase_details.findIndex(row => row.purchase_unit_id === itemId)

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState.purchase_details]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...nestedRowMedicine
      }
      updatedState.purchase_details = updatedNestedRows

      console.log('after update editParams', updatedNestedRows)

      console.log('test while update', updatedNestedRows)
      setEditParams(updatedState)
      setNestedRowMedicine(initialNestedRowMedicine)
      setMedicineItemId('')
    } else {
      console.error('updateTableItems error')
    }
  }

  const updateFormItems = () => {
    // const HasErrors = !nestedRowMedicine.medicine_name || !nestedRowMedicine.purchase_qty
    // if (HasErrors) {
    //   setItemErrors(validate(nestedRowMedicine))

    //   return
    // }
    // setErrors({})
    const HasErrors =
      !nestedRowMedicine.medicine_name ||
      !nestedRowMedicine.purchase_qty ||
      !nestedRowMedicine.priority_item ||
      !nestedRowMedicine.control_substance
    if (HasErrors) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }
    if (nestedRowMedicine.control_substance === 'yes') {
      if (nestedRowMedicine.control_substance_file.length === 0) {
        setItemErrors(validate(nestedRowMedicine))

        return
      }
    }
    setErrors({})
    updateTableItems()
  }

  const handleSubmit = () => {
    const formHasErrors = !editParams.po_no || !editParams.po_date || !editParams.store_id || !editParams.supplier_id
    console.log(formHasErrors)
    if (formHasErrors) {
      setErrors(validateItems(editParams))

      return
    }

    setErrors({})
    showDialog()
  }

  console.log('getMedicineOptions', optionsMedicineList)

  const getStoresLists = async () => {
    console.log('function in')
    // setLoader(true)
    const response = await getStoreList()
    console.log('function in')
    console.log('response', response)
    if (response?.length > 0) {
      console.log('list', response)
      setStores(response)
    }
  }

  const getSuppliersLists = async () => {
    console.log('function in')
    // setLoader(true)
    const response = await getSuppliers()
    console.log('suppliers response', response)
    if (response.data.data?.length > 0) {
      console.log('list', response)
      setSuppliers(response.data.data)
    }
  }

  useEffect(() => {
    getStoresLists()
    getSuppliersLists()
  }, [])
  // API calling functions on mount endnd

  console.log('editParams', editParams)

  const handleCustom = async data => {
    console.log('in custom', data)
    try {
      getSearchValue(data)
      console.log('Validation successful')
    } catch (validationErrors) {
      console.log('Validation failed:', validationErrors)
    }
  }
  async function getSearchValue(searchText, index) {
    if (searchText !== '') {
      const searchResults = await getMedicineToAddPurchase(searchText)
      console.log('in search input ', searchResults)
      if (searchResults?.length) {
        console.log(
          'maped obj',
          searchResults?.map(item => ({
            value: item.id,
            label: item.name
          }))
        )
        setOptionsMedicineList(
          searchResults?.map(item => ({
            value: item.id,
            label: item.name,
            purchase_unit_price: item.supplier_price
            // supplier_price: item.supplier_price
          }))
        )
      }
    }
  }

  const getListOfItemsById = async id => {
    const result = await getPurchaseListById(id)
    console.log('data of update values', result)

    if (result) {
      // filterToStocks(result.to_store_id)
      setEditParams({
        ...editParams,
        id: result.id,
        from_store_id: result.from_store_id,
        to_store_id: result.to_store_id,
        ro_date: result.ro_date,
        from_store_type: result.from_store_type,
        to_store_type: result.to_store_type,
        purchase_details: result.purchase_details
      })
    }
  }

  // ****** edit section //////
  const editTableData = itemId => {
    if (id != undefined && action === 'edit') {
      const getItems = editParams.purchase_details.filter(el => {
        return el.id === itemId
      })
      console.log('filtered items while editing', getItems[0])

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0].medicine_name,
        id: getItems[0].id,
        purchase_qty: getItems[0].purchase_qty,
        dosageForm: getItems[0].dosageForm
      })
    } else {
      console.log('in else ', editParams.purchase_details)

      const getItems = editParams.purchase_details.filter(el => {
        return el.purchase_unit_id === itemId
      })
      // console.log('filtered', getItems[0].medicine_name)
      console.log('filtered', getItems)
      console.log('file', getItems[0].control_substance_file)
      console.log('nestedRowMedicine', nestedRowMedicine)
      // const file=[]

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0].medicine_name,
        purchase_unit_id: getItems[0].purchase_unit_id,
        // id: getItems[0].id,
        purchase_qty: getItems[0].purchase_qty,
        control_substance_file: getItems[0].control_substance_file,
        priority_item: getItems[0].priority_item,
        control_substance: getItems[0].control_substance
      })
    }
  }
  console.log('nestedRowMedicine', nestedRowMedicine)

  useEffect(() => {
    if (id != undefined && action === 'edit') {
      getListOfItemsById(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, action])

  // ****** edit section //////
  // data posting section

  const postItemsData = async () => {
    setSubmitLoader(true)
    const postData = editParams
    postData.total_qty = totalQty
    console.log('while posting data', postData)
    console.log('totalQtya', totalQty)
    console.log('editParms', editParams)
    if (id) {
      const response = await updatePurchase(id, postData)
      console.log('after posting', response)

      if (response?.success) {
        toast.success(response.message)
        setSubmitLoader(false)
        getListOfItemsById(id)
      } else {
        setSubmitLoader(false)
        console.log('test')
        toast.error(response.message)
      }
    } else {
      const response = await addPurchase(postData)
      console.log('after posting', response)
      if (response?.success) {
        toast.success(response.message)
        setEditParams(editParamsInitialState)
        setSubmitLoader(false)
      } else {
        setSubmitLoader(false)
        console.log('test')
        toast.error(response.message)
      }
    }
  }

  // data posting section
  const createForm = () => {
    return (
      <CardContent>
        <form
        // addItemsToTable={addMultipleMedicine(addItemsToTable)}
        >
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Autocomplete
                  inputProps={{ tabIndex: '6' }}
                  disablePortal
                  id='autocomplete-controlled'
                  options={optionsMedicineList}
                  value={nestedRowMedicine.medicine_name}
                  onChange={(event, newValue) => {
                    console.log('options', newValue)
                    // nestedRowMedicine, setNestedRowMedicine
                    console.log('in medicine auto complte', newValue)
                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      medicine_name: newValue?.label,
                      // purchase_stock_item_id: newValue?.value,
                      purchase_unit_id: newValue?.value,
                      purchase_unit_price: newValue?.purchase_unit_price
                      // purchase_purchase_price: newValue?.supplier_price * nestedRowMedicine.purchase_qty
                    })
                    setDuplicateMedError('')
                    setItemErrors({})
                  }}
                  onKeyUp={e => {
                    console.log('eee values', e.target.value)
                    handleCustom(e.target.value)
                    setItemErrors({})
                  }}
                  renderInput={params => (
                    <TextField {...params} label='Medicine Name' error={Boolean(itemErrors.medicine_name)} />
                  )}
                />
                {itemErrors.medicine_name && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
                {duplicateMedError && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    {duplicateMedError}
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* purchase_expiry_date */}
              <FormControl fullWidth>
                <SingleDatePicker
                  fullWidth
                  date={
                    nestedRowMedicine.purchase_expiry_date
                      ? parseFormattedDate(nestedRowMedicine.purchase_expiry_date)
                      : null
                  }
                  width={'100%'}
                  value={
                    nestedRowMedicine.purchase_expiry_date
                      ? parseFormattedDate(nestedRowMedicine.purchase_expiry_date)
                      : null
                  }
                  name={'Date'}
                  onChangeHandler={date => {
                    console.log(date)
                    // setStores({ ...stores, date: date })
                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      purchase_expiry_date: formatDate(date)
                    })
                    setItemErrors({})
                  }}
                  customInput={<CustomInput label='Date' error={Boolean(errors.purchase_expiry_date)} />}
                />
                {itemErrors.purchase_expiry_date && (
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
                  value={nestedRowMedicine.purchase_qty}
                  error={Boolean(itemErrors.purchase_qty)}
                  label='Quantity'
                  onChange={event => {
                    const val = parseInt(event.target.value, 10)
                    const supplierPrice = nestedRowMedicine.purchase_unit_price
                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      purchase_qty: val,
                      purchase_purchase_price: val * supplierPrice
                    })
                    setItemErrors({})
                  }}
                />
                {itemErrors.purchase_qty && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  type='text'
                  value={nestedRowMedicine.purchase_batch_no}
                  error={Boolean(itemErrors.purchase_batch_no)}
                  label='Batch'
                  onChange={event => {
                    setNestedRowMedicine({ ...nestedRowMedicine, purchase_batch_no: event.target.value })
                    setItemErrors({})
                  }}
                />
                {itemErrors.purchase_batch_no && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  type='text'
                  value={nestedRowMedicine.purchase_unit_price}
                  error={Boolean(itemErrors.purchase_unit_price)}
                  label='Supplier rate'
                  onChange={event => {
                    setNestedRowMedicine({ ...nestedRowMedicine, purchase_unit_price: event.target.value })
                    setItemErrors({})
                  }}
                />
                {itemErrors.purchase_unit_price && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  type='Number'
                  value={nestedRowMedicine.purchase_purchase_price}
                  error={Boolean(itemErrors.purchase_purchase_price)}
                  label='Total purchase price'
                  onChange={event => {
                    setNestedRowMedicine({ ...nestedRowMedicine, purchase_purchase_price: event.target.value })
                    setItemErrors({})
                  }}
                />
                {itemErrors.purchase_purchase_price && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* // file uploader */}
            <Grid item xs={12}>
              {medicineItemId ? (
                <>
                  <Button
                    onClick={() => {
                      closeDialog()
                    }}
                    size='large'
                    variant='contained'
                    color='error'
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      updateFormItems()

                      // submitItems()
                    }}
                    size='large'
                    variant='contained'
                  >
                    update
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      closeDialog()
                    }}
                    size='large'
                    variant='contained'
                    color='error'
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // updateFormItems()
                      submitItems()
                    }}
                    size='large'
                    variant='contained'
                  >
                    Add
                  </Button>
                </>
              )}
            </Grid>
          </Grid>
        </form>
      </CardContent>
    )
  }
  // console.log('stores', stores)
  console.log('nestedRowMedicine', editParams)

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
        <CardHeader title='Add Purchase' />
        <Grid>
          <Button
            size='big'
            variant='contained'
            onClick={() => {
              Router.push('/pharmacy/request/requestList/')
            }}
          >
            Payment List
          </Button>
          <Button
            sx={{
              mx: { sm: 6, xs: 'auto' }
            }}
            size='big'
            variant='contained'
            onClick={() => {
              Router.push('/pharmacy/request/requestList/')
            }}
          >
            Purchase List
          </Button>
        </Grid>
      </Grid>
      <CardContent>
        <Grid container>
          <CommonDialogBox
            title={'Add Purchase Item'}
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
                <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                  Supplier :
                </Typography>
              </Grid>
              <Grid xs={12} sm={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors.supplier_id)}>Supplier</InputLabel>
                  <Select
                    value={editParams.supplier_id}
                    error={Boolean(errors.supplier_id)}
                    label='Select'
                    disabled={id ? true : false}
                    onChange={e => {
                      setEditParams({
                        ...editParams,
                        supplier_id: e.target.value
                      })
                      setErrors({})
                    }}
                    // error={Boolean(errors?.state_id)}
                    // labelId='state_id'
                  >
                    {suppliers?.map((item, index) => (
                      <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                        {item?.name}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.supplier_id && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <TextField
                    type='text'
                    value={editParams.po_no}
                    error={Boolean(errors.po_no)}
                    label='Purchase No'
                    onChange={e => {
                      setEditParams({
                        ...editParams,
                        po_no: e.target.value
                      })
                      setErrors({})
                    }}
                  />
                  {errors.po_no && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <TextField
                    type='text'
                    value={editParams.description}
                    error={Boolean(errors.description)}
                    label='Comments'
                    onChange={e => {
                      setEditParams({
                        ...editParams,
                        description: e.target.value
                      })
                      setErrors({})
                    }}
                  />
                  {errors.description && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                <Grid xs={12} sm={12} sx={{ mb: 5 }}>
                  <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                    Store:
                  </Typography>
                </Grid>
                <FormControl fullWidth>
                  <InputLabel id='state_id' error={Boolean(errors.store_id)}>
                    Store
                  </InputLabel>

                  <Select
                    name='state_id'
                    error={Boolean(errors.store_id)}
                    value={editParams.store_id}
                    label='Select'
                    disabled={id ? true : false}
                    onChange={e => {
                      // setStores({ ...stores, toStore: e.target.value })
                      // setEditParams({
                      //   ...editParams,
                      //   store_id: e.target.value
                      // })
                      getStoreType(e.target.value)
                      setErrors({})
                    }}
                    // error={Boolean(errors?.state_id)}
                    // labelId='state_id'
                  >
                    {stores?.map((item, index) => (
                      <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                        {item?.name}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.store_id && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <SingleDatePicker
                    fullWidth
                    date={editParams.po_date ? parseFormattedDate(editParams.po_date) : null}
                    width={'100%'}
                    value={editParams.po_date ? parseFormattedDate(editParams.po_date) : null}
                    name={'Date'}
                    onChangeHandler={date => {
                      console.log(date)
                      // setStores({ ...stores, date: date })
                      setEditParams({ ...editParams, po_date: formatDate(date) })
                      setErrors({})
                    }}
                    customInput={<CustomInput label='Date' error={Boolean(errors.po_date)} />}
                  />
                  {errors.po_date && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <TextField
                    type='text'
                    value={nestedRowMedicine.purchase_qty}
                    error={Boolean(errors.purchase_qty)}
                    label='User'
                    onChange={event => {
                      setNestedRowMedicine({ ...nestedRowMedicine, purchase_qty: event.target.value })
                      setErrors({})
                    }}
                  />
                  {errors.purchase_qty && (
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
        sm={12}
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 4
        }}
      >
        {id ? null : (
          <Button
            sx={{
              mx: { sm: 6, xs: 'auto' }
            }}
            onClick={() => {
              handleSubmit()
            }}
            size='big'
            variant='contained'
          >
            Add Purchase Item
          </Button>
        )}
      </Grid>

      {/* <Divider
        sx={{ mt: theme => `${theme.spacing(6.5)} !important`, mb: theme => `${theme.spacing(5.5)} !important` }}
      /> */}
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
            <TableRow>
              <TableCell>Medicine Name</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Supplier Rate</TableCell>
              <TableCell>Total Purchase purchase_unit_price</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {editParams.purchase_details
              ? editParams.purchase_details.map((el, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{el.medicine_name}</TableCell>
                      <TableCell>{el.priority_item}</TableCell>
                      {/* <TableCell>{el.control_substance}</TableCell> */}
                      {/* <TableCell>{el.control_substance_file.name}</TableCell> */}
                      <TableCell>{el.purchase_qty}</TableCell>

                      <TableCell>
                        <IconButton
                          size='small'
                          sx={{ mr: 0.5 }}
                          aria-label='Edit'
                          onClick={() => {
                            if (id) {
                              console.log(id.stock_item_id)
                              setMedicineItemId(el.stock_item_id)
                              editTableData(el.id)
                              showDialog()
                            } else {
                              console.log(el.purchase_unit_id)
                              setMedicineItemId(el.purchase_unit_id)

                              editTableData(el.purchase_unit_id)
                              showDialog()
                            }
                          }}
                        >
                          <Icon icon='mdi:pencil-outline' />
                        </IconButton>
                        {id ? null : (
                          <IconButton
                            onClick={() => {
                              removeItemsFroTable(el.purchase_unit_id)
                            }}
                            size='small'
                            sx={{ mr: 0.5 }}
                          >
                            <Icon icon='mdi:delete-outline' />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
          </TableBody>
        </Table>
      </TableContainer>
      <CardContent sx={{ pt: 8 }}>
        {/* {totalQty ? ( */}
        <Grid container>
          <Grid
            item
            xs={12}
            sm={3}
            lg={3}
            sx={{
              mb: { sm: 0, xs: 4 },
              order: { sm: 2, xs: 1 },
              marginLeft: 'auto',
              mr: { sm: 12, xs: 0 }
            }}
          >
            <CalcWrapper>
              <Typography variant='body2'>Sub Total :</Typography>
              <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                {totalQty}
              </Typography>
            </CalcWrapper>
            <Divider
              sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
            />
            <CalcWrapper>
              <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth>
                    <InputLabel>Discount</InputLabel>
                    <Select
                      label='Discount'
                      disabled={id ? true : false}
                      onChange={e => {
                        setEditParams({
                          ...editParams,
                          from_store_id: e.target.value,
                          from_store_type: ''
                        })
                        setErrors({})
                      }}
                      // error={Boolean(errors?.state_id)}
                      // labelId='state_id'
                    >
                      <MenuItem value=''>%</MenuItem>
                      <MenuItem value=''>₹</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth>
                    <TextField
                      type='text'
                      value={nestedRowMedicine.purchase_qty}
                      error={Boolean(itemErrors.purchase_qty)}
                      label='Discount'
                      onChange={event => {
                        setNestedRowMedicine({ ...nestedRowMedicine, purchase_qty: event.target.value })
                        setErrors({})
                      }}
                    />
                    {itemErrors.purchase_qty && (
                      <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                        This field is required
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </CalcWrapper>
            <Divider
              sx={{ mt: theme => `${theme.spacing(3)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
            />
            <CalcWrapper>
              <Typography variant='body2'>Grand Total :</Typography>
              <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                {totalQty}
              </Typography>
            </CalcWrapper>

            <Divider
              sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
            />
            {/* <CalcWrapper>
                <Typography variant='body2'>Total:</Typography>
                <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                  {totalQty}
                </Typography>
              </CalcWrapper> */}
          </Grid>
        </Grid>
        {/* // ) : null} */}
      </CardContent>
      <LoadingButton
        sx={{ float: 'right', my: 4, mx: 6 }}
        size='large'
        onClick={() => {
          postItemsData()
        }}
        variant='contained'
        loading={submitLoader}
      >
        Save
      </LoadingButton>
    </Card>
  )
}

export default AddPurchaseForm
