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
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Router from 'next/router'
import { useRouter } from 'next/router'
import { LoadingButton } from '@mui/lab'
import toast from 'react-hot-toast'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import { Tooltip } from '@mui/material'
// ** React Imports
import { forwardRef, useState, useEffect, useCallback } from 'react'
import CustomChip from 'src/@core/components/mui/chip'

import CommonDialogBox from 'src/components/CommonDialogBox'
import SingleDatePicker from '../../SingleDatePicker'
import { debounce } from 'lodash'

import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getMedicineList, getGenericMedicineList } from 'src/lib/api/pharmacy/getMedicineList'

import {
  addRequestItems,
  getRequestItemsListById,
  updateRequestItems,
  // deleteLineItem,
  cancelRequestItems
} from 'src/lib/api/pharmacy/getRequestItemsList'
import Utility from 'src/utility'
import { usePharmacyContext } from 'src/context/PharmacyContext'
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
import { AddButton, RequestCancelButton } from 'src/components/Buttons'

const editParamsInitialState = {
  from_store_type: '',
  // to_store_type: '',

  from_store_id: '',
  // to_store_id: '',
  from_store_type: '',
  // to_store_type: '',
  ro_date: Utility.formattedPresentDate(),
  total_qty: '',
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
  prescription_required: false,
  prescription_required_file: '',
  package: '',
  manufacture: '',
  unit_price: '',
  genericName: '',
  notes: ''
}

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const AddRequestForm = () => {
  // ** Hook
  const [toStocks, setToStocks] = useState([])
  const [fromStocks, setFromStocks] = useState([])
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [optionsMedicineList, setOptionsMedicineList] = useState([])
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [itemErrors, setItemErrors] = useState({})
  const [medicineItemId, setMedicineItemId] = useState('')
  const [submitLoader, setSubmitLoader] = useState(false)
  const [duplicateMedError, setDuplicateMedError] = useState('')
  // const [deleteItemId, setDeleteItemId] = useState('')

  const [nestedRowMedicine, setNestedRowMedicine] = useState(initialNestedRowMedicine)
  // const [deleteDialog, setDeleteDialog] = useState(false)
  const [cancelRequestDialog, setCancelRequestDialog] = useState(false)

  const router = useRouter()
  const { selectedPharmacy } = usePharmacyContext()
  const { id, action } = router.query

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
    setItemErrors({})
  }

  const showDialog = () => {
    setShow(true)
  }

  // local nested items delete
  const removeItemsFromTable = itemId => {
    const updatedItems = editParams.request_item_details.filter(el => {
      return el.request_item_medicine_id != itemId
    })
    setEditParams({ ...editParams, request_item_details: updatedItems })
    setMedicineItemId('')
  }

  const totalQty = editParams.request_item_details?.reduce((acc, row) => acc + parseInt(row.request_item_qty), 0)

  const addItemsToTable = () => {
    const newData = {
      medicine_name: nestedRowMedicine.medicine_name,
      request_item_medicine_id: nestedRowMedicine.request_item_medicine_id,
      // id: nestedRowMedicine.id,
      request_item_qty: nestedRowMedicine.request_item_qty,
      // dosageForm: nestedRowMedicine.dosageForm,
      priority_item: nestedRowMedicine.priority_item,
      control_substance: nestedRowMedicine.control_substance,
      control_substance_file: nestedRowMedicine.control_substance_file,
      prescription_required: nestedRowMedicine.prescription_required,
      prescription_required_file: nestedRowMedicine.prescription_required_file,
      package: nestedRowMedicine.package,
      manufacture: nestedRowMedicine.manufacture,
      request_item_leaf_id: '',
      unit_price: nestedRowMedicine?.unit_price,
      genericName: nestedRowMedicine.genericName,
      notes: nestedRowMedicine?.notes
    }

    const updatedNestedRows = [...editParams.request_item_details, newData]
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
    // console.log('validate', values.request_item_qty)
    const itemErrors = {}
    if (!values.medicine_name || values.medicine_name === '') {
      itemErrors.medicine_name = 'This field is required'
    }
    if (!values.request_item_qty) {
      itemErrors.request_item_qty = 'This field is required'
    }
    // if (Number(values.request_item_qty) === 0 || Number(values.request_item_qty) < 0) {
    //   itemErrors.request_item_qty = 'Enter valid Quantity '
    // }
    if (!values.request_item_qty) {
      itemErrors.request_item_qty = 'This field is required'
    }

    if (Number.isInteger(nestedRowMedicine.request_item_qty) || Number(values.request_item_qty) <= 0) {
      itemErrors.request_item_qty = 'Enter valid Quantity'
    }

    if (!values.priority_item) {
      itemErrors.priority_item = 'This field is required'
    }
    // removing mandatory conation
    // if (values.control_substance === true) {
    //   if (values.control_substance_file.length === 0) {
    //     itemErrors.control_substance_file = 'This field is required'
    //   }
    // }
    if (values.prescription_required === true) {
      if (values.prescription_required_file.length === 0) {
        itemErrors.prescription_required_file = 'This field is required'
      }
    }
    // itemErrors.control_substance = 'This field is required'
    // }

    return itemErrors
  }

  const validateItems = values => {
    const errors = {}

    if (!values.from_store_id) {
      errors.from_store_id = 'This field is required'
    }
    // if (!values.to_store_id) {
    //   errors.to_store_id = 'This field is required'
    // }
    if (!values.ro_date) {
      errors.ro_date = 'This field is required'
    }

    return errors
  }

  const submitItems = () => {
    const HasErrors =
      !nestedRowMedicine.medicine_name ||
      !nestedRowMedicine.request_item_qty ||
      !nestedRowMedicine.priority_item ||
      !Number.isInteger(Number(nestedRowMedicine.request_item_qty)) ||
      Number(nestedRowMedicine.request_item_qty) === 0 ||
      Number(nestedRowMedicine.request_item_qty) < 0

    if (HasErrors) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }
    // removing mandatory conation

    // if (nestedRowMedicine.control_substance === true) {
    //   if (nestedRowMedicine.control_substance_file.length === 0) {
    //     setItemErrors(validate(nestedRowMedicine))

    //     return
    //   }
    // }
    if (nestedRowMedicine.prescription_required === true) {
      if (nestedRowMedicine.prescription_required_file.length === 0) {
        setItemErrors(validate(nestedRowMedicine))

        return
      }
    }

    const isMedicineAlreadyExists = editParams.request_item_details.some(
      item => item.medicine_name === nestedRowMedicine.medicine_name
    )

    if (isMedicineAlreadyExists) {
      setDuplicateMedError('Medicine already exists')

      return
    }
    setErrors({})
    addItemsToTable()
    closeDialog()
  }

  const updateTableItems = () => {
    const itemId = medicineItemId
    const updatedState = { ...editParams }

    const updatedIndex = updatedState.request_item_details.findIndex(row => row.request_item_medicine_id === itemId)

    if (updatedIndex !== -1) {
      const updatedNestedRows = [...updatedState.request_item_details]
      updatedNestedRows[updatedIndex] = {
        ...updatedNestedRows[updatedIndex],
        ...nestedRowMedicine
      }
      updatedState.request_item_details = updatedNestedRows

      setEditParams(updatedState)
      setNestedRowMedicine(initialNestedRowMedicine)
      setMedicineItemId('')
    } else {
      console.error('updateTableItems error')
    }
    closeDialog()
  }

  const updateFormItems = () => {
    const HasErrors =
      !nestedRowMedicine.medicine_name ||
      !nestedRowMedicine.request_item_qty ||
      !nestedRowMedicine.priority_item ||
      !Number.isInteger(Number(nestedRowMedicine.request_item_qty)) ||
      Number(nestedRowMedicine.request_item_qty) === 0 ||
      Number(nestedRowMedicine.request_item_qty) < 0
    // ||!nestedRowMedicine.control_substance
    if (HasErrors) {
      setItemErrors(validate(nestedRowMedicine))

      return
    }
    // removing mandatory conation

    // if (nestedRowMedicine.control_substance === true) {
    //   if (nestedRowMedicine.control_substance_file.length === 0) {
    //     setItemErrors(validate(nestedRowMedicine))

    //     return
    //   }
    // }
    if (nestedRowMedicine.prescription_required === true) {
      if (nestedRowMedicine.prescription_required_file.length === 0) {
        setItemErrors(validate(nestedRowMedicine))

        return
      }
    }
    setErrors({})
    updateTableItems()
  }

  const handleSubmit = () => {
    const formHasErrors = !editParams.from_store_id || !editParams.ro_date
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
      //params: { q: 'central', column: 'type' }
      const response = await getStoreList({ params: { type: 'central' } })
      if (response.success && response?.data?.list_items?.length > 0) {
        setFromStocks(response?.data?.list_items)
        setToStocks(response?.data?.list_items)

        if (id === undefined) {
          setEditParams({
            ...editParams,
            from_store_id: response?.data?.list_items[0].id,
            from_store_type: response?.data?.list_items[0].type
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
      const params = {
        sort: 'asc',
        q: searchText,
        limit: 20,
        active: true
      }

      const searchResults = await getMedicineList({ params: params })
      if (searchResults?.data?.list_items.length > 0) {
        let optionMedListFromApi = searchResults?.data?.list_items?.map(item => ({
          value: item.id,
          name: item.name,
          package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
          label: `${item.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
          manufacture: item.manufacturer_name,
          control_substance: item.controlled_substance === '1' ? true : false,
          status: item?.active === '0' ? 0 : 1,
          prescription_required: item?.prescription_required === '1' ? true : false,
          unit_price: item?.unit_price ? item?.unit_price : 0,
          genericName: item?.generic_name
        }))
        setOptionsMedicineList(optionMedListFromApi)
        setItemErrors({})
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

  const fetchGenericMedicineData = async searchText => {
    try {
      const params = {
        sort: 'asc',
        q: '',
        limit: 20,
        active: true,
        generic: searchText
      }

      const searchResults = await getGenericMedicineList({ params: params })
      if (searchResults?.data?.list_items.length > 0) {
        setOptionsMedicineList(
          searchResults?.data?.list_items?.map(item => ({
            value: item.id,
            genericName: item?.generic_name,
            name: item?.name,
            package: `${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}`,
            label: `${item.name} (${item?.package} of ${item?.package_qty} ${item?.package_uom_label} ${item?.product_form_label}) `,
            manufacture: item.manufacturer_name,
            control_substance: item.controlled_substance === '1' ? true : false,
            status: item?.active === '0' ? 0 : 1,
            prescription_required: item?.prescription_required === '1' ? true : false,
            unit_price: item?.unit_price ? item?.unit_price : 0
          }))
        )
        setItemErrors({})
      }
    } catch (e) {
      console.log('error', e)
    }
  }

  const searchGenericMedicineData = useCallback(
    debounce(async searchText => {
      try {
        await fetchGenericMedicineData(searchText)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    []
  )
  useEffect(() => {
    getStoresLists()
    fetchMedicineData('')
  }, [])
  //  ****** debounce

  const getListOfItemsById = async id => {
    const result = await getRequestItemsListById(id)

    if (result?.success === true && result?.data?.request_item_details?.length > 0) {
      const lineItems = result?.data?.request_item_details.map(el => {
        return {
          request_item_medicine_id: el?.stock_item_id,
          medicine_name: el?.stock_name,
          request_item_qty: el?.qty,
          request_item_leaf_id: el?.stock_item_id,
          priority_item: el?.priority,
          control_substance: el?.control_substance === '0' ? false : true,
          control_substance_file: el?.control_substance_file !== '' ? el?.control_substance_file : '',
          prescription_required: el?.prescription_required === '0' ? false : true,
          prescription_required_file: el?.prescription_required_file !== '' ? el?.prescription_required_file : '',
          id: el?.id,
          request_item_detail_id: el?.id,
          dispatch_item_id: el?.dispatch_item_id,
          package: `${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`,
          manufacture: el?.manufacturer,
          unit_price: el?.unit_price,
          genericName: el?.generic_name,
          notes: el?.description
        }
      })

      setEditParams({
        ...editParams,
        id: result.data.id,
        from_store_id: result.data.from_store_id,
        //to_store_id: result.data.to_store_id,
        ro_date: result.data.request_date,
        from_store_type: result.data.from_store_type,
        // to_store_type: result.data.to_store_type,
        request_item_details: lineItems
      })
      // }
    }
  }

  // ****** edit section //////
  const editTableData = itemId => {
    if (id != undefined && action === 'edit') {
      const getItems = editParams.request_item_details.filter(el => {
        return el.request_item_medicine_id === itemId
      })

      setNestedRowMedicine({
        ...nestedRowMedicine,
        request_item_medicine_id: getItems[0].request_item_medicine_id,
        medicine_name: getItems[0].medicine_name,
        request_item_qty: getItems[0].request_item_qty,
        request_item_leaf_id: getItems[0].request_item_leaf_id,
        priority_item: getItems[0].priority_item,
        control_substance: getItems[0].control_substance,
        control_substance_file: getItems[0].control_substance_file,
        prescription_required: getItems[0].prescription_required,
        prescription_required_file: getItems[0].prescription_required_file,
        id: getItems[0].id,
        package: getItems[0].package,
        manufacture: getItems[0].manufacture,
        unit_price: getItems[0]?.unit_price,
        genericName: getItems[0].genericName,
        notes: getItems[0].notes
      })
    } else {
      const getItems = editParams.request_item_details.filter(el => {
        return el.request_item_medicine_id === itemId
      })

      setNestedRowMedicine({
        ...nestedRowMedicine,
        medicine_name: getItems[0].medicine_name,
        request_item_medicine_id: getItems[0].request_item_medicine_id,
        // id: getItems[0].id,
        request_item_qty: getItems[0].request_item_qty,
        priority_item: getItems[0].priority_item,
        control_substance_file: getItems[0].control_substance_file ? getItems[0].control_substance_file : '',
        control_substance: getItems[0].control_substance,
        prescription_required_file: getItems[0].prescription_required_file
          ? getItems[0].prescription_required_file
          : '',

        prescription_required: getItems[0].prescription_required,
        package: getItems[0].package,
        manufacture: getItems[0].manufacture,
        unit_price: getItems[0]?.unit_price,
        genericName: getItems[0].genericName,
        notes: getItems[0].notes
      })
    }
  }

  useEffect(() => {
    if (id !== undefined && action === 'edit') {
      getListOfItemsById(id)
    }
  }, [id, action])

  // ****** edit section //////
  // data posting section

  const postItemsData = async () => {
    setSubmitLoader(true)
    const postData = editParams
    postData.total_qty = totalQty

    if (id) {
      try {
        const response = await updateRequestItems(id, postData)

        if (response?.success) {
          toast.success(response?.message)
          setSubmitLoader(false)
          getListOfItemsById(id)
          Router.push(`/pharmacy/request/${response?.data}`)
        } else {
          setSubmitLoader(false)
          toast.error(response?.message)
        }
      } catch (error) {
        console.log('error', error)
      }
    } else {
      try {
        const response = await addRequestItems(postData)
        if (response?.success) {
          toast.success(response?.message)
          setEditParams(editParamsInitialState)
          setSubmitLoader(false)
          Router.push(`/pharmacy/request/${response?.data}`)
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

  const cancelRequest = async id => {
    if (id) {
      try {
        const result = await cancelRequestItems(id)
        if (result?.data?.success === true) {
          toast.success(result?.data?.data)
          Router.push(`/pharmacy/request/request-list/`)
        } else {
          closeCancelDialog()
          toast.error(result?.data?.data)
        }
      } catch (error) {
        toast.error(error?.data)
        console.log('error', error)
      }
    }
  }

  // data posting section
  const createForm = () => {
    return (
      // <CardContent>
      <form style={{ width: '100%' }}>
        <Grid container item spacing={5} xs={12}>
          <Grid item xs={12} sm={11 / 2}>
            <FormControl fullWidth>
              <Autocomplete
                // sx={{ zIndex: 1 }}
                // forcePopupIcon={false}
                // inputProps={{ tabIndex: '6' }}
                // disablePortal
                id='autocomplete-controlled'
                options={optionsMedicineList}
                renderOption={(props, option) => (
                  <li
                    {...props}
                    style={{ opacity: option.status ? 1 : 0.5, pointerEvents: option.status ? 'auto' : 'none' }}
                  >
                    <Box>
                      <Typography>{option.name}</Typography>
                      <Typography variant='body2'>{option.package}</Typography>
                      <Typography variant='body2'>{option.manufacture}</Typography>
                      {option.control_substance === true && (
                        <CustomChip label='CS' skin='light' color='success' size='small' />
                      )}{' '}
                      {option.prescription_required === true && (
                        <CustomChip label='PR' skin='light' color='success' size='small' />
                      )}
                    </Box>
                  </li>
                )}
                value={nestedRowMedicine.medicine_name ? nestedRowMedicine.medicine_name : ''}
                onChange={(event, newValue) => {
                  setNestedRowMedicine({
                    ...nestedRowMedicine,
                    medicine_name: newValue?.name,
                    request_item_medicine_id: newValue?.value,
                    control_substance: newValue?.control_substance,
                    prescription_required: newValue?.prescription_required,
                    package: newValue?.package,
                    manufacture: newValue?.manufacture,
                    genericName: newValue?.genericName,
                    unit_price: newValue?.unit_price
                  })
                  setDuplicateMedError('')
                  setItemErrors({})
                }}
                onKeyUp={e => {
                  searchMedicineData(e.target.value)
                  setItemErrors({})
                }}
                onBlur={() => {
                  fetchMedicineData('')
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder='Search by product name'
                    label='Search by Product Name*'
                    error={Boolean(itemErrors.medicine_name)}
                  />
                )}
                // isOptionEqualToValue={(option, value) => {
                //   console.log('option', option)
                //   console.log('value', value)

                //   return option?.name === value
                // }}
                // getOptionLabel={option => {
                //   return option?.medicine_name || nestedRowMedicine?.medicine_name || ''
                // }}
                // getOptionLabel={option => option?.label}
                // renderOption={option => (
                //   <Box sx={{ my: 3, mx: 2 }}>
                //     <div>{option.key.split('Manufacturer')[0]}</div>
                //     <div>{option.key.split('Manufacturer')[1]}</div>
                //   </Box>
                // )}
              />
              {nestedRowMedicine.medicine_name && (
                <Grid container item sx={{ my: 2 }}>
                  <Grid item xs={12} md={6} sx={{ my: { xs: 4, md: 0 } }}>
                    <Tooltip title={nestedRowMedicine.package}>
                      <Chip
                        label={nestedRowMedicine.package}
                        color='primary'
                        variant='outlined'
                        size='sm'
                        sx={{ mr: 2, fontSize: 11, height: '22px', width: 'full' }}
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Tooltip title={nestedRowMedicine.manufacture}>
                      <Chip
                        label={nestedRowMedicine.manufacture}
                        color='primary'
                        variant='outlined'
                        size='sm'
                        sx={{ mr: 2, fontSize: 11, height: '22px', width: 'full' }}
                      />
                    </Tooltip>
                  </Grid>
                  {nestedRowMedicine.control_substance === true && (
                    <CustomChip sx={{ mt: 1, mx: 1 }} label='CS' skin='light' color='success' size='small' />
                  )}
                  {nestedRowMedicine.prescription_required === true && (
                    <CustomChip sx={{ mt: 1 }} label='PR' skin='light' color='success' size='small' />
                  )}
                </Grid>
              )}
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
          {console.log('optionsMedicineList', optionsMedicineList)}
          <Grid item xs={12} sm={1}>
            <Typography sx={{ my: 4, textAlign: 'center' }}>OR</Typography>
          </Grid>
          <Grid item xs={12} sm={11 / 2}>
            <FormControl fullWidth>
              <Autocomplete
                // sx={{ zIndex: 1 }}
                // forcePopupIcon={true}
                // inputProps={{ tabIndex: '6' }}
                // disablePortal
                id='autocomplete-controlled'
                options={optionsMedicineList}
                renderOption={(props, option) => (
                  <li
                    {...props}
                    style={{ opacity: option.status ? 1 : 0.5, pointerEvents: option.status ? 'auto' : 'none' }}
                  >
                    <Box>
                      <Typography>{option.genericName ? option.genericName : 'Generic name not available'}</Typography>
                      <Typography variant='body2'>{`Product - ${option.name}`}</Typography>

                      <Typography variant='body2'>{option.package}</Typography>
                      <Typography variant='body2'>{option.manufacture}</Typography>
                    </Box>
                  </li>
                )}
                value={nestedRowMedicine.genericName ? nestedRowMedicine.genericName : ''}
                onChange={(event, newValue) => {
                  setNestedRowMedicine({
                    ...nestedRowMedicine,
                    medicine_name: newValue?.name,
                    request_item_medicine_id: newValue?.value,
                    control_substance: newValue?.control_substance,
                    prescription_required: newValue?.prescription_required,
                    package: newValue?.package,
                    manufacture: newValue?.manufacture,
                    unit_price: newValue?.unit_price,
                    genericName: newValue?.genericName
                  })
                  setDuplicateMedError('')
                  setItemErrors({})
                }}
                onKeyUp={e => {
                  searchGenericMedicineData(e.target.value)

                  setItemErrors({})
                }}
                onBlur={() => {}}
                renderInput={params => (
                  <TextField
                    {...params}
                    placeholder='Search by Generic name'
                    label='Search by Generic Name*'
                    error={Boolean(itemErrors.medicine_name)}
                  />
                )}
                isOptionEqualToValue={(option, value) => {
                  return option?.genericName === value
                }}
                getOptionLabel={option => {
                  return option?.genericName || nestedRowMedicine?.genericName || ''
                }}
                // getOptionLabel={option => option?.label}
                // renderOption={option => (
                //   <Box sx={{ my: 3, mx: 2 }}>
                //     <div>{option.key.split('Manufacturer')[0]}</div>
                //     <div>{option.key.split('Manufacturer')[1]}</div>
                //   </Box>
                // )}
              />
              {nestedRowMedicine.medicine_name && (
                <Grid container item sx={{ my: 2 }}>
                  <Grid item xs={12} md={6} sx={{ my: { xs: 4, md: 0 } }}>
                    <Tooltip title={nestedRowMedicine.package}>
                      <Chip
                        label={nestedRowMedicine.package}
                        color='primary'
                        variant='outlined'
                        size='sm'
                        sx={{ mr: 2, fontSize: 11, height: '22px', width: 'full' }}
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Tooltip title={nestedRowMedicine.manufacture}>
                      <Chip
                        label={nestedRowMedicine.manufacture}
                        color='primary'
                        variant='outlined'
                        size='sm'
                        sx={{ mr: 2, fontSize: 11, height: '22px', width: 'full' }}
                      />
                    </Tooltip>
                  </Grid>
                  {nestedRowMedicine.control_substance === true && (
                    <CustomChip sx={{ mt: 1, mx: 1 }} label='CS' skin='light' color='success' size='small' />
                  )}
                  {nestedRowMedicine.prescription_required === true && (
                    <CustomChip sx={{ mt: 1 }} label='PR' skin='light' color='success' size='small' />
                  )}
                </Grid>
              )}
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

          <Grid item xs={12} sm={11 / 2}>
            <FormControl fullWidth>
              <TextField
                type='number'
                value={nestedRowMedicine.request_item_qty}
                error={Boolean(itemErrors.request_item_qty)}
                label='Quantity*'
                onChange={event => {
                  setNestedRowMedicine({ ...nestedRowMedicine, request_item_qty: event.target.value })
                  setItemErrors({})
                }}
              />
              {itemErrors?.request_item_qty && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  {/* This field is required */}
                  {itemErrors?.request_item_qty}
                </FormHelperText>
              )}

              {nestedRowMedicine.unit_price > 0 ? (
                <Box sx={{ mx: 1, my: 2, display: 'flex' }}>
                  <Chip
                    label={`Unit Price - ${nestedRowMedicine.unit_price}`}
                    color='primary'
                    variant='outlined'
                    size='sm'
                    sx={{ mr: 2, fontSize: 11, height: '22px' }}
                  />
                  <Chip
                    label={`Total QTY Price - ${nestedRowMedicine.unit_price * nestedRowMedicine.request_item_qty}`}
                    color='primary'
                    variant='outlined'
                    size='sm'
                    sx={{ mr: 2, fontSize: 11, height: '22px' }}
                  />
                </Box>
              ) : null}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1}></Grid>
          <Grid item xs={12} sm={11 / 2}>
            <FormControl fullWidth>
              <TextField
                type='text'
                value={nestedRowMedicine.notes}
                error={Boolean(itemErrors.notes)}
                label='Notes'
                onChange={event => {
                  setNestedRowMedicine({ ...nestedRowMedicine, notes: event.target.value })
                  setItemErrors({})
                }}
              />
              {itemErrors?.notes && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                  {/* This field is required */}
                  {itemErrors?.notes}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={11 / 2}>
            <Typography>Priority</Typography>
            <RadioGroup
              row
              aria-label='controlled'
              name='controlled'
              value={nestedRowMedicine?.priority_item}
              onChange={event => {
                setNestedRowMedicine({ ...nestedRowMedicine, priority_item: event.target.value })
              }}
            >
              <FormControlLabel value='high' control={<Radio />} label='High' />
              <FormControlLabel value='Normal' control={<Radio />} label='Normal' />
            </RadioGroup>
          </Grid>

          {/* // file uploader */}
          <Grid item xs={12} sm={1}></Grid>
          {/* {nestedRowMedicine.control_substance === true && nestedRowMedicine.prescription_required == false && (
            <Grid item xs={12} sm={11 / 2}>
              <CustomChip label='CS' skin='light' color='success' size='small' />
            </Grid>
          )} */}

          {/* {nestedRowMedicine.control_substance === true ? (
            nestedRowMedicine.control_substance_file ? (
              <Grid item xs={12} sm={11 / 2}>
                {nestedRowMedicine.control_substance_file?.type === 'application/pdf' ? (
                  <Chip
                    label={nestedRowMedicine.control_substance_file?.name}
                    color='secondary'
                    onDelete={() => {
                      setNestedRowMedicine({
                        ...nestedRowMedicine,
                        // control_substance: false,
                        control_substance_file: ''
                      })
                    }}
                    deleteIcon={<Icon icon='mdi:delete-outline' />}
                  />
                ) : nestedRowMedicine.control_substance_file?.type === 'image/png' ||
                  nestedRowMedicine.control_substance_file?.type === 'image/jpeg' ? (
                  <>
                    <Chip
                      label={nestedRowMedicine.control_substance_file?.name}
                      avatar={
                        <Avatar
                          alt={nestedRowMedicine.control_substance_file?.name}
                          src={
                            nestedRowMedicine.control_substance_file
                              ? URL.createObjectURL(nestedRowMedicine.control_substance_file)
                              : ''
                          }
                        />
                      }
                      onDelete={() => {
                        setNestedRowMedicine({
                          ...nestedRowMedicine,
                          // control_substance: false,
                          control_substance_file: ''
                        })
                      }}
                    />
                  </>
                ) : (
                  <Chip
                    label={nestedRowMedicine.control_substance_file}
                    avatar={<Avatar alt='image' src={nestedRowMedicine?.control_substance_file} />}
                    onDelete={() => {
                      setNestedRowMedicine({
                        ...nestedRowMedicine,
                        // control_substance: false,
                        control_substance_file: ''
                      })
                    }}
                  />
                )}
              </Grid>
            ) : (
              <Grid item xs={12} sm={11 / 2}>
                <Typography sx={{ mb: 2 }}>Attach details (Mandatory for controlled substances)</Typography>
                <FormControl fullWidth>
                  <TextField
                    type='file'
                    accept='.pdf, .jpeg, .jpg, .png'
                    error={Boolean(itemErrors.control_substance_file)}
                    // label='Attach prescription'
                    onChange={e => {
                      // const file = e.target.files[0]
                      // setNestedRowMedicine({ ...nestedRowMedicine, control_substance_file: file })
                      // setItemErrors({})
                      const file = e.target.files[0]
                      if (!file) return
                      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
                      if (allowedTypes.includes(file.type)) {
                        setNestedRowMedicine(prevState => ({
                          ...prevState,
                          control_substance_file: file
                        }))
                        setItemErrors({})
                      } else {
                        setItemErrors({
                          control_substance_file: 'File type not allowed. Please upload a PDF, JPEG, or PNG.'
                        })
                        e.target.value = ''
                      }
                    }}
                  />
                  {itemErrors?.control_substance_file && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      {itemErrors?.control_substance_file}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )
          ) : null} */}
          {nestedRowMedicine.prescription_required === true ? (
            nestedRowMedicine.prescription_required_file ? (
              <Grid item xs={12} sm={11 / 2} sx={{ ml: 'auto' }}>
                {nestedRowMedicine.prescription_required_file?.type === 'application/pdf' ? (
                  <Chip
                    label={nestedRowMedicine.prescription_required_file?.name}
                    color='secondary'
                    onDelete={() => {
                      setNestedRowMedicine({
                        ...nestedRowMedicine,
                        // control_substance: false,
                        prescription_required_file: ''
                      })
                    }}
                    deleteIcon={<Icon icon='mdi:delete-outline' />}
                  />
                ) : nestedRowMedicine.prescription_required_file?.type === 'image/png' ||
                  nestedRowMedicine.prescription_required_file?.type === 'image/jpeg' ? (
                  <>
                    <Chip
                      label={nestedRowMedicine.prescription_required_file?.name}
                      avatar={
                        <Avatar
                          alt={nestedRowMedicine.prescription_required_file?.name}
                          src={
                            nestedRowMedicine.prescription_required_file
                              ? URL.createObjectURL(nestedRowMedicine.prescription_required_file)
                              : ''
                          }
                        />
                      }
                      onDelete={() => {
                        setNestedRowMedicine({
                          ...nestedRowMedicine,
                          // control_substance: false,
                          prescription_required_file: ''
                        })
                      }}
                    />
                  </>
                ) : (
                  <Chip
                    label={nestedRowMedicine.prescription_required_file}
                    avatar={<Avatar alt='image' src={nestedRowMedicine.prescription_required_file} />}
                    onDelete={() => {
                      setNestedRowMedicine({
                        ...nestedRowMedicine,
                        // control_substance: false,
                        prescription_required_file: ''
                      })
                    }}
                  />
                )}
              </Grid>
            ) : (
              <Grid item xs={12} sm={11 / 2} sx={{ ml: 'auto' }}>
                <Typography sx={{ mb: 2 }}>
                  Attach prescription details (Mandatory){' '}
                  {nestedRowMedicine.control_substance === true && (
                    <CustomChip label='CS' skin='light' color='success' size='small' />
                  )}{' '}
                </Typography>
                <FormControl fullWidth>
                  <TextField
                    type='file'
                    accept='.pdf, .jpeg, .jpg, .png'
                    error={Boolean(itemErrors.prescription_required_file)}
                    // label='Attach prescription'
                    onChange={e => {
                      // const file = e.target.files[0]
                      // setNestedRowMedicine({ ...nestedRowMedicine, prescription_required_file: file })
                      // setItemErrors({})
                      const file = e.target.files[0]
                      if (!file) return
                      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
                      if (allowedTypes.includes(file.type)) {
                        setNestedRowMedicine(prevState => ({
                          ...prevState,
                          prescription_required_file: file
                        }))
                        setItemErrors({})
                      } else {
                        setItemErrors({
                          prescription_required_file: 'File type not allowed. Please upload a PDF, JPEG, or PNG.'
                        })
                        e.target.value = ''
                      }
                    }}
                  />
                  {itemErrors?.prescription_required_file && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      {itemErrors?.prescription_required_file}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )
          ) : null}

          {/* // file uploader */}

          {/* <Grid item xs={12}> */}
          <Grid item xs={12}>
            <Box sx={{ float: 'right' }}>
              {medicineItemId ? (
                <>
                  <Button
                    sx={{ mr: 2 }}
                    onClick={() => {
                      updateFormItems()
                      // closeDialog()
                      // submitItems()
                    }}
                    size='large'
                    variant='contained'
                  >
                    update
                  </Button>
                  {/* <Button
                      onClick={() => {
                        closeDialog()
                      }}
                      size='large'
                      variant='outlined'
                    >
                      Done
                    </Button> */}
                </>
              ) : (
                <>
                  <Button
                    sx={{ mr: 2 }}
                    onClick={() => {
                      // updateFormItems()
                      submitItems()
                    }}
                    size='large'
                    variant='contained'
                  >
                    Add
                  </Button>
                  {/* <Button
                      onClick={() => {
                        closeDialog()
                      }}
                      size='large'
                      variant='outlined'
                    >
                      Done
                    </Button> */}
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </form>
      // </CardContent>
    )
  }

  return (
    <Card>
      <Grid
        item
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
                Router.push('/pharmacy/request/request-list/')
              }}
              icon='ep:back'
            />
          }
          title={id ? 'Edit Request' : 'Add Request'}
        />
      </Grid>
      <CardContent>
        <Grid container>
          <CommonDialogBox
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
              <Grid item xs={12} sm={12} sx={{ mb: 5 }}>
                <Grid item xs={12} sm={12} sx={{ mb: 5 }}>
                  <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                    Requested to :
                  </Typography>
                </Grid>
                <FormControl fullWidth>
                  <InputLabel id='state_id' error={Boolean(errors.from_store_id)}>
                    Store*
                  </InputLabel>

                  <Select
                    error={Boolean(errors.from_store_id)}
                    value={editParams.from_store_id}
                    label='Store*'
                    disabled={id ? true : false}
                    onChange={e => {
                      setEditParams({
                        ...editParams,
                        from_store_id: e.target.value,
                        from_store_type: storesType[filteredStoreType(e.target.value)]
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

                  {errors.from_store_id && (
                    <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Grid item xs={12} sm={12} sx={{ mb: 5 }}>
                <Typography variant='subtitle2' sx={{ mb: 3, color: 'text.primary', letterSpacing: '.1px' }}>
                  &nbsp;
                </Typography>
              </Grid>
              {/* <Grid xs={12} sm={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <InputLabel error={Boolean(errors.to_store_id)}>Store*</InputLabel>
                  <Select
                    value={editParams.to_store_id}
                    error={Boolean(errors.to_store_id)}
                    label='Store*'
                    disabled={id ? true : false}
                    onChange={e => {
                      filterToStocks(e.target.value)
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
                    {fromStocks?.map((item, index) => (
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
              </Grid> */}
              <Grid item xs={12} sm={12} lg={12} sx={{ mx: 'auto', mb: 5 }}>
                <FormControl fullWidth>
                  <SingleDatePicker
                    disabled={true}
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
        <Grid
          container
          item
          spacing={6}
          sm={12}
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mb: 2,
            mt: 2
          }}
        >
          <AddButton
            title='Add Request Item'
            action={() => {
              handleSubmit()
            }}
          />
        </Grid>
      </CardContent>

      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#F5F5F7' }}>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit price</TableCell>
              <TableCell>Total QTY price</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {editParams?.request_item_details
              ? editParams?.request_item_details.map((el, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant='body2' sx={{ color: 'text.primary' }}>
                          {el.medicine_name}
                        </Typography>
                        {el.control_substance ? (
                          <CustomChip label='CS' skin='light' color='success' size='small' />
                        ) : null}{' '}
                        {el.prescription_required ? (
                          <CustomChip label='PR' skin='light' color='success' size='small' />
                        ) : null}
                        <Typography variant='body2'>{el.package}</Typography>
                        <Typography variant='body2'>{el.manufacture}</Typography>
                      </TableCell>

                      <TableCell sx={{ color: el?.priority_item === 'Normal' ? 'green' : 'red' }}>
                        {el?.priority_item ? (el?.priority_item === 'Normal' ? 'Normal' : 'High') : null}
                      </TableCell>

                      <TableCell align='center'>{el.request_item_qty}</TableCell>
                      <TableCell align='center'>{el.unit_price > 0 ? el.unit_price : 'NA'}</TableCell>
                      <TableCell align='center'>
                        {el?.unit_price * el?.request_item_qty > 0 ? el?.unit_price * el?.request_item_qty : 'NA'}
                      </TableCell>
                      <TableCell align='left'>
                        <Tooltip title={el?.notes}>
                          <Typography
                            sx={{
                              minWidth: 30,
                              maxWidth: 80,
                              cursor: 'pointer',
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              WebkitLineClamp: 6,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {el?.notes ? el?.notes : 'NA'}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <IconButton
                          size='small'
                          sx={{ mr: 0.5 }}
                          aria-label='Edit'
                          onClick={() => {
                            setMedicineItemId(el.request_item_medicine_id)

                            editTableData(el.request_item_medicine_id)
                            showDialog()
                          }}
                        >
                          <Icon icon='mdi:pencil-outline' />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            // if (editParams?.request_item_details?.length === 1) {
                            //   openCancelDialog()
                            // } else {
                            removeItemsFromTable(el.request_item_medicine_id)
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
                              console.log('line items', el)

                              if (editParams?.request_item_details?.length === 1) {
                                openCancelDialog()
                              } else {
                                removeItemsFromTable(el.request_item_medicine_id)
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
                <Typography variant='body2'>Total Quantity:</Typography>
                <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: '.25px', fontWeight: 600 }}>
                  {totalQty}
                </Typography>
              </CalcWrapper>

              <Divider
                sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
              />
            </Grid>
          </Grid>
        ) : null}
      </CardContent>
      <Grid item xs={12}>
        <Box sx={{ float: 'right', my: 4, mx: 6 }}>
          {id && editParams?.request_item_details?.length > 0 ? (
            <>
              <RequestCancelButton
                title='Cancel Request'
                action={() => {
                  openCancelDialog()
                  // setEditParams(editParamsInitialState)
                }}
              />
            </>
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
              disabled={editParams.request_item_details.length > 0 ? false : true}
              onClick={() => {
                setEditParams({
                  ...editParams,
                  total_qty: '',
                  request_item_details: []
                })
                // setEditParams(editParamsInitialState)
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
                <DialogContentText sx={{ mb: 1 }}>
                  {/* Are you sure you want to Cancel this request? If you cancel this request it will be disabled you
                  cannot perform any operations for this request */}
                  Are you sure you want to cancel this request?
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
                  No
                </Button>
                <Button
                  size='small'
                  variant='contained'
                  color='error'
                  onClick={() => {
                    cancelRequest(id)
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
                    cancelRequest(id)
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
  )
}

export default AddRequestForm
