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
import { debounce } from 'lodash'
import CircularProgress from '@mui/material/CircularProgress'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'

// ** React Imports
import { forwardRef, useState, useEffect } from 'react'

// ** Configs
import themeConfig from 'src/configs/themeConfig'
import AddRequestDialog from './AddRequestDialog'
import SingleDatePicker from '../../SingleDatePicker'
import { debouncedSearchCommon, generateErrMsg } from 'src/components/utility/debounce'
import { getStoreList } from 'src/lib/api/getStoreList'
import { getMedicineBySearch } from 'src/lib/api/getMedicineBySearch'
import { addRequestItems, getRequestItemsListById, updateRequestItems } from 'src/lib/api/getRequestItemsList'

const MUITableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: 0,
  padding: `${theme.spacing(1, 0)} !important`
}))

const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Third Party Imports
import DatePicker from 'react-datepicker'
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Label } from 'recharts'
import { getItemDescriptor } from '@babel/core/lib/config/item'

const editParamsInitialState = {
  // id: '',
  // medicine_name: '',
  from_store_id: '',
  to_store_id: '',
  from_store_type: '',
  to_store_type: '',
  dispatch_id: '',
  // batch_id: '',
  ro_date: '',
  stock_qty: '',
  box_pattern: '',
  box_qty: '',
  total_qty: '',
  total_box: '20',
  user: '',
  nestedRows: []
}

// const storesData = {
//   toStore: '',
//   fromStore: '',
//   date: '',
//   user: ''
// }

// const initialState = [
//   {
//     id: '',
//     medicine_name: '',
//     batch_id: '',
//     expiry_date: '',
//     stock_qty: '',
//     box_pattern: '',
//     box_qty: '',
//     qty: '',
//     nestedRows: []
//   }
// ]

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddRequestForm = () => {
  // ** Hook
  // const [stores, setStores] = useState(storesData)
  const [toStocks, setToStocks] = useState([])
  const [fromStocks, setFromStocks] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [itemErrors, setItemErrors] = useState({})
  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)

  const [nestedRowMedicine, setNestedRowMedicine] = useState({
    medicine_name: '',
    medicine_id: '',
    // id: '',
    qty: '',
    dosageForm: ''
  })
  const router = useRouter()
  const { id, action } = router.query

  const storesType = {
    local: 1,
    central: 2
  }

  const filteredStoreType = value => {
    return fromStocks?.find(item => item.id == value)?.type
  }

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  // local nested items delete
  const removeItemsFroTable = itemId => {
    const updatedItems = editParams.nestedRows.filter(el => {
      return el.medicine_id != itemId
    })
    setEditParams({ ...editParams, nestedRows: updatedItems })
  }

  const totalQty = editParams.nestedRows?.reduce((acc, row) => acc + parseInt(row.qty), 0)
  console.log(totalQty)

  const addItemsToTable = () => {
    const newData = {
      medicine_name: nestedRowMedicine.medicine_name,
      medicine_id: nestedRowMedicine.medicine_id,
      // id: nestedRowMedicine.id,
      qty: nestedRowMedicine.qty,
      dosageForm: nestedRowMedicine.dosageForm
    }

    const updatedNestedRows = [...editParams.nestedRows, newData]
    console.log(updatedNestedRows)
    setEditParams({
      ...editParams,
      nestedRows: updatedNestedRows
    })

    setNestedRowMedicine({
      medicine_name: '',
      // id: '',
      qty: '',
      dosageForm: '',
      medicine_id: ''
    })
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
    if (!values.qty) {
      itemErrors.qty = 'This field is required'
    }
    if (!values.dosageForm) {
      itemErrors.dosageForm = 'This field is required'
    }

    return itemErrors
  }

  const validateItems = values => {
    const errors = {}

    if (!values.from_store_id) {
      errors.from_store_id = 'This field is required'
    }
    if (!values.to_store_id) {
      errors.to_store_id = 'This field is required'
    }
    if (!values.ro_date) {
      errors.ro_date = 'This field is required'
    }
    if (!values.user) {
      errors.user = 'This field is required'
    }

    return errors
  }

  const submitItems = () => {
    const HasErrors = !nestedRowMedicine.medicine_name || !nestedRowMedicine.qty || !nestedRowMedicine.dosageForm
    if (HasErrors) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }
    setErrors({})
    addItemsToTable()
  }

  const updateTableItems = () => {
    const itemId = medicineItemId
    const updatedState = { ...editParams }

    const updatedIndex = id
      ? updatedState.nestedRows.findIndex(row => row.stock_item_id === medicineItemId)
      : updatedState.nestedRows.findIndex(row => row.medicine_id === itemId)

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState.nestedRows]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...nestedRowMedicine
      }
      updatedState.nestedRows = updatedNestedRows
      setEditParams(updatedState)
      setNestedRowMedicine({
        medicine_name: '',
        // id: '',
        qty: '',
        medicine_id: '',
        dosageForm: ''
      })
      setMedicineItemId('')
    } else {
      console.error('updateTableItems error')
    }
  }

  const updateFormItems = () => {
    const HasErrors = !nestedRowMedicine.medicine_name || !nestedRowMedicine.qty || !nestedRowMedicine.dosageForm
    if (HasErrors) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }
    setErrors({})
    updateTableItems()
  }

  const handleSubmit = () => {
    const formHasErrors =
      !editParams.from_store_id || !editParams.to_store_id || !editParams.ro_date || !editParams.user
    console.log(formHasErrors)
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
    const response = await getStoreList()
    if (response?.length > 0) {
      console.log('list', response)

      setFromStocks(response)
      setToStocks(response)
    } else {
    }
  }

  useEffect(() => {
    getStoresLists()
  }, [])

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
      const searchResults = await getMedicineBySearch(searchText)
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
            label: item.name
          }))
        )
      }
    }
  }

  const getListOfItemsById = async id => {
    const result = await getRequestItemsListById(id)
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
        nestedRows: result.request_item_details
      })
    }
  }

  // ****** edit section //////
  const editTableData = itemId => {
    if (id != undefined && action === 'edit') {
      const getItems = editParams.nestedRows.filter(el => {
        return el.id === itemId
      })
      console.log('filtered items while editing', getItems[0])

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0].medicine_name,
        id: getItems[0].id,
        qty: getItems[0].qty,
        dosageForm: getItems[0].dosageForm,
        batch_no: getItems[0].batch_no,
        box_qty: getItems[0].box_qty,
        created_at: getItems[0].created_at,
        created_by: getItems[0].created_by,
        deleted_at: getItems[0].deleted_at,
        description: getItems[0].description,
        dispatch_qty: getItems[0].dispatch_qty,
        expiry_date: getItems[0].expiry_date,
        leaf_id: getItems[0].leaf_id,
        mrp_price: getItems[0].mrp_price,
        net_amount: getItems[0].net_amount,
        purchase_price: getItems[0].purchase_price,
        recieved_qty: getItems[0].recieved_qty,
        request_item_id: getItems[0].request_item_id,
        request_status: getItems[0].request_status,
        requested_qty: getItems[0].requested_qty,
        status: getItems[0].status,
        stock_item_id: getItems[0].stock_item_id,
        stock_qty: getItems[0].stock_qty,
        unit_id: getItems[0].unit_id,
        unit_price: getItems[0].unit_price,
        updated_at: getItems[0].updated_at,
        updated_by: getItems[0].updated_by
      })
    } else {
      console.log('in else ', editParams.nestedRows)

      const getItems = editParams.nestedRows.filter(el => {
        return el.medicine_id === itemId
      })
      // console.log('filtered', getItems[0].medicine_name)
      console.log('filtered', getItems)

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0].medicine_name,
        medicine_id: getItems[0].medicine_id,
        // id: getItems[0].id,
        qty: getItems[0].qty,
        dosageForm: getItems[0].dosageForm
      })
    }
  }
  console.log('nestedRowMedicine', nestedRowMedicine)

  useEffect(() => {
    if (id != undefined && action === 'edit') {
      getListOfItemsById(id)
    }
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
      const response = await updateRequestItems(id, postData)
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
      const response = await addRequestItems(postData)
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

                    setNestedRowMedicine({
                      ...nestedRowMedicine,
                      medicine_name: newValue?.label,
                      medicine_id: newValue?.value
                    })
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
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <TextField
                  value={nestedRowMedicine.dosageForm}
                  error={Boolean(itemErrors.dosageForm)}
                  label='Dosage form'
                  onChange={event => {
                    setNestedRowMedicine({ ...nestedRowMedicine, dosageForm: event.target.value })
                    setItemErrors({})
                  }}
                  placeholder=''
                />
                {/*
                {errorMultipleMedicine?.dosage_form && (
                  <FormHelperText sx={{ color: 'error.main' }}>
                    {errorMultipleMedicine?.dosage_form.message}
                  </FormHelperText>
                )} */}
                {itemErrors.dosageForm && (
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
                  value={nestedRowMedicine.qty}
                  error={Boolean(itemErrors.qty)}
                  label='Quantity'
                  onChange={event => {
                    setNestedRowMedicine({ ...nestedRowMedicine, qty: event.target.value })
                    setItemErrors({})
                  }}
                />
                {itemErrors.qty && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                    This field is required
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              {id ? (
                <Button
                  onClick={() => {
                    updateFormItems()
                  }}
                  size='large'
                  variant='contained'
                >
                  Update
                </Button>
              ) : (
                <>
                  <>
                    {medicineItemId ? (
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
                    ) : (
                      <Button
                        onClick={() => {
                          // updateFormItems()

                          submitItems()
                        }}
                        size='large'
                        variant='contained'
                      >
                        Submit
                      </Button>
                    )}
                  </>
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
        <CardHeader title='Add Request Item' />

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
          Request Item List
        </Button>
      </Grid>
      <CardContent>
        <Grid container>
          <AddRequestDialog
            title={'Add Request Item'}
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
                  From Stock:
                </Typography>
              </Grid>
              <Grid xs={12} sm={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors.from_store_id)}>Store</InputLabel>
                  <Select
                    value={editParams.from_store_id}
                    error={Boolean(errors.from_store_id)}
                    label='Select'
                    disabled={id ? true : false}
                    onChange={e => {
                      filterToStocks(e.target.value)
                      // console.log('from stock selected', storesType[filteredStoreType(e.target.value)])
                      // setStores({
                      //   ...stores,
                      //   fromStore: e.target.value,
                      //   from_store_type: storesType[filteredStoreType(e.target.value)].toString()
                      // })
                      setEditParams({
                        ...editParams,
                        from_store_id: e.target.value,
                        from_store_type: storesType[filteredStoreType(e.target.value)].toString()
                      })
                      setErrors({})
                    }}
                    // error={Boolean(errors?.state_id)}
                    // labelId='state_id'
                  >
                    {fromStocks?.map((item, index) => (
                      <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                        {item?.name}
                      </MenuItem>
                    ))}
                  </Select>

                  {errors.from_store_id && (
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
                    date={editParams.ro_date ? parseFormattedDate(editParams.ro_date) : null}
                    width={'100%'}
                    value={editParams.ro_date ? parseFormattedDate(editParams.ro_date) : null}
                    name={'Date'}
                    onChangeHandler={date => {
                      console.log(date)
                      // setStores({ ...stores, date: date })
                      setEditParams({ ...editParams, ro_date: formatDate(date) })
                      setErrors({})
                    }}
                    customInput={<CustomInput label='Date' error={Boolean(errors.ro_date)} />}
                  />
                  {errors.ro_date && (
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
                    To Stock:
                  </Typography>
                </Grid>
                <FormControl fullWidth>
                  <InputLabel id='state_id' error={Boolean(errors.to_store_id)}>
                    Store
                  </InputLabel>

                  <Select
                    name='state_id'
                    error={Boolean(errors.to_store_id)}
                    value={editParams.to_store_id}
                    label='Select'
                    disabled={id ? true : false}
                    onChange={e => {
                      // setStores({ ...stores, toStore: e.target.value })
                      setEditParams({
                        ...editParams,
                        to_store_id: e.target.value,
                        to_store_type: storesType[filteredStoreType(e.target.value)].toString()
                      })
                      setErrors({})

                      // filterFromStocks(e.target.value)
                    }}
                    // error={Boolean(errors?.state_id)}
                    // labelId='state_id'
                  >
                    {console.log('in stocks', toStocks)}
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

              <Grid item xs={12} sm={12}>
                <FormControl fullWidth>
                  <TextField
                    value={editParams.user}
                    label='User'
                    error={Boolean(errors.user)}
                    onChange={e => {
                      // setStores({ ...stores, user: e.target.value })
                      setEditParams({ ...editParams, user: e.target.value })
                      setErrors({})
                    }}
                    placeholder=''
                    // error={Boolean(errors?.user)}
                    name='user'
                  />

                  {errors.user && (
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
            Add Request Item
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
              <TableCell>Medicine Names</TableCell>
              <TableCell>Dosage form</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {editParams.nestedRows
              ? editParams.nestedRows.map((el, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{el.medicine_name}</TableCell>
                      <TableCell>{el.dosageForm}</TableCell>
                      <TableCell>{el.qty}</TableCell>

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
                              console.log(el.medicine_id)
                              setMedicineItemId(el.medicine_id)

                              editTableData(el.medicine_id)
                              showDialog()
                            }
                          }}
                        >
                          <Icon icon='mdi:pencil-outline' />
                        </IconButton>
                        {id ? null : (
                          <IconButton
                            onClick={() => {
                              removeItemsFroTable(el.medicine_id)
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
                <Typography variant='body2'>Total QTY:</Typography>
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
        ) : null}
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

export default AddRequestForm
